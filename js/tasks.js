/* ── UA Plataforma · tasks.js — SheetBest backend ── */

const Tasks = (() => {

  const API = 'https://api.sheetbest.com/sheets/3e2abf06-1511-46b0-bd43-e72dd1f5088b';

  let userId = null;
  let _cache = null;

  function init(uid) {
    userId = uid;
    _cache = null;
  }

  async function maybeSeed() {
    const flagKey = `ua_seeded_${userId}`;
    if (localStorage.getItem(flagKey)) return;
    const today = new Date();
    const add = days => { const d = new Date(today); d.setDate(d.getDate() + days); return d.toISOString().slice(0,10); };
    const seed = [
      { nombre:'Entregar Informe Innova Tec',    curso:'Innovación Tecnológica', fecha:add(0),  estado:'Pendiente',   prioridad:'Alta',    notas:'Análisis de plataformas low-code.' },
      { nombre:'Revisión de lecturas IA',         curso:'Inteligencia Artificial',fecha:add(-1), estado:'Completado',  prioridad:'Media',   notas:'Capítulos 3 y 4 de Russell.' },
      { nombre:'Proyecto Mejora Ágil Cafetalero', curso:'Gestión de Proyectos',  fecha:add(5),  estado:'En progreso', prioridad:'Alta',    notas:'Sprint 2: validar flujo de registro.' },
      { nombre:'Parcial de Estadística',          curso:'Estadística Aplicada',  fecha:add(-3), estado:'Vencido',     prioridad:'Crítica', notas:'Distribuciones e intervalos de confianza.' },
      { nombre:'Presentación Bases de Datos',     curso:'Bases de Datos',        fecha:add(7),  estado:'Pendiente',   prioridad:'Media',   notas:'Modelo ER con Draw.io.' },
      { nombre:'Taller de Algoritmos',            curso:'Estructuras de Datos',  fecha:add(2),  estado:'En progreso', prioridad:'Media',   notas:'Árbol AVL en Python.' },
    ];
    for (const t of seed) {
      t.id = 't' + Date.now() + Math.random().toString(36).slice(2,5);
      t.userId = userId;
      t.createdAt = new Date().toISOString();
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t)
      });
      await new Promise(r => setTimeout(r, 200));
    }
    localStorage.setItem(flagKey, '1');
  }

  async function getAll() {
    if (_cache) return _cache;
    try {
      const res  = await fetch(`${API}/search?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      _cache = Array.isArray(data) ? data : [];
    } catch(e) {
      console.error('SheetBest error:', e);
      _cache = [];
    }
    return _cache;
  }

  async function add(data) {
    const task = {
      id: 't' + Date.now(),
      userId,
      createdAt: new Date().toISOString(),
      ...data,
    };
    _cache = null;
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    return task;
  }

  async function update(id, data) {
    const tasks = await getAll();
    const existing = tasks.find(t => t.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    _cache = null;
    await fetch(`${API}/id/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    return updated;
  }

  async function remove(id) {
    _cache = null;
    await fetch(`${API}/id/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async function toggleDone(id) {
    const tasks = await getAll();
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    await update(id, { estado: t.estado === 'Completado' ? 'Pendiente' : 'Completado' });
  }

  async function getStats() {
    const tasks = await getAll();
    const today = new Date().toISOString().slice(0,10);
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
    return tasks
      .filter(t => t.estado !== 'Completado')
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
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
