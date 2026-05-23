/* ── UA Plataforma · tasks.js — Google Sheets backend ── */

const Tasks = (() => {

  const API = 'https://script.google.com/a/macros/autonoma.edu.pe/s/AKfycbzGn-IXe1til7ygl8yj0ATxwf-ft7523QJsB7d2o5tCA80oPPecSES5t7OCF0BXpF_S8w/exec';

  let userId = null;
  let _cache = null; // memoria local para velocidad

  function init(uid) {
    userId = uid;
    _cache = null;
  }

  /* ── Helpers de red ── */
  async function get(params) {
    const url = API + '?' + new URLSearchParams({ ...params, userId });
    const res = await fetch(url);
    return res.json();
  }

  async function post(body) {
    const res = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ ...body, userId }),
    });
    return res.json();
  }

  /* ── Seed de tareas de ejemplo (solo primera vez) ── */
  async function maybeSeed() {
    const flagKey = `ua_seeded_${userId}`;
    if (localStorage.getItem(flagKey)) return;
    const today = new Date();
    const fmt = d => d.toISOString().slice(0, 10);
    const add = days => { const d = new Date(today); d.setDate(d.getDate() + days); return fmt(d); };

    const seed = [
      { nombre:'Entregar Informe Innova Tec',      curso:'Innovación Tecnológica', fecha:add(0),  estado:'Pendiente',   prioridad:'Alta',   notas:'Análisis de plataformas low-code. Incluir Glide, Google Sheets y comparativa.' },
      { nombre:'Revisión de lecturas IA',           curso:'Inteligencia Artificial', fecha:add(-1), estado:'Completado', prioridad:'Media',  notas:'Capítulos 3 y 4 de Russell. Búsqueda heurística y lógica proposicional.' },
      { nombre:'Proyecto Mejora Ágil Cafetalero',  curso:'Gestión de Proyectos',   fecha:add(5),  estado:'En progreso', prioridad:'Alta',   notas:'Sprint 2: validar flujo de registro de lotes.' },
      { nombre:'Parcial de Estadística',            curso:'Estadística Aplicada',   fecha:add(-3), estado:'Vencido',     prioridad:'Crítica',notas:'Distribuciones, intervalos de confianza, regresión lineal.' },
      { nombre:'Presentación de Bases de Datos',   curso:'Bases de Datos',         fecha:add(7),  estado:'Pendiente',   prioridad:'Media',  notas:'Modelo ER del sistema de biblioteca. Usar Draw.io.' },
      { nombre:'Taller de Algoritmos',              curso:'Estructuras de Datos',   fecha:add(2),  estado:'En progreso', prioridad:'Media',  notas:'Implementar árbol AVL en Python.' },
    ];

    for (const t of seed) {
      t.id = 't' + Date.now() + Math.random().toString(36).slice(2, 6);
      t.createdAt = new Date().toISOString();
      await post({ action: 'saveTask', task: t });
    }
    localStorage.setItem(flagKey, '1');
  }

  /* ── API pública ── */

  async function getAll() {
    if (_cache) return _cache;
    try {
      const data = await get({ action: 'getTasks' });
      _cache = Array.isArray(data) ? data : [];
    } catch(e) {
      console.error('Sheets error:', e);
      _cache = [];
    }
    return _cache;
  }

  async function add(data) {
    const task = {
      id: 't' + Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    await post({ action: 'saveTask', task });
    _cache = null; // invalidar cache
    return task;
  }

  async function update(id, data) {
    const tasks = await getAll();
    const existing = tasks.find(t => t.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    await post({ action: 'updateTask', task: updated });
    _cache = null;
    return updated;
  }

  async function remove(id) {
    await post({ action: 'deleteTask', id });
    _cache = null;
  }

  async function toggleDone(id) {
    const tasks = await getAll();
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    const newEstado = t.estado === 'Completado' ? 'Pendiente' : 'Completado';
    await update(id, { estado: newEstado });
    return { ...t, estado: newEstado };
  }

  async function getStats() {
    const tasks = await getAll();
    const today = new Date().toISOString().slice(0, 10);
    const total      = tasks.length;
    const completado = tasks.filter(t => t.estado === 'Completado').length;
    const pendiente  = tasks.filter(t => t.estado === 'Pendiente').length;
    const progreso   = tasks.filter(t => t.estado === 'En progreso').length;
    const vencido    = tasks.filter(t => t.estado === 'Vencido' || (t.fecha < today && t.estado !== 'Completado' && t.estado !== 'En progreso')).length;
    const pct        = total ? Math.round(completado / total * 100) : 0;
    const cursos     = [...new Set(tasks.map(t => t.curso))];
    return { total, completado, pendiente, progreso, vencido, pct, cursos };
  }

  async function getUpcoming(limit = 5) {
    const tasks = await getAll();
    const today = new Date().toISOString().slice(0, 10);
    return tasks
      .filter(t => t.estado !== 'Completado')
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, limit);
  }

  async function getCourseBreakdown() {
    const tasks = await getAll();
    const cursos = [...new Set(tasks.map(t => t.curso))];
    return cursos.map(c => ({
      curso: c,
      total: tasks.filter(t => t.curso === c).length,
      done:  tasks.filter(t => t.curso === c && t.estado === 'Completado').length,
    }));
  }

  return { init, maybeSeed, getAll, add, update, remove, toggleDone, getStats, getUpcoming, getCourseBreakdown };
})();
