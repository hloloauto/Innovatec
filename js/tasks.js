/* ── UA Plataforma · tasks.js ── */

const Tasks = (() => {

  let userId = null;

  function key() { return `ua_tasks_${userId}`; }

  function init(uid) {
    userId = uid;
    if (!localStorage.getItem(key())) {
      const today = new Date();
      const fmt = d => d.toISOString().slice(0, 10);
      const add = (n, days) => { const d = new Date(today); d.setDate(d.getDate() + days); return fmt(d); };

      const seed = [
        { id:'t1', nombre:'Entregar Informe Innova Tec', curso:'Innovación Tecnológica', fecha: add(today, 0),  estado:'Pendiente',    prioridad:'Alta',   notas:'Análisis de plataformas low-code. Incluir Glide, Google Sheets y comparativa.' },
        { id:'t2', nombre:'Revisión de lecturas IA',      curso:'Inteligencia Artificial', fecha: add(today,-1), estado:'Completado',   prioridad:'Media',  notas:'Capítulos 3 y 4 de Russell. Búsqueda heurística y lógica proposicional.' },
        { id:'t3', nombre:'Proyecto Mejora Ágil Cafetalero', curso:'Gestión de Proyectos', fecha: add(today, 5), estado:'En progreso', prioridad:'Alta',   notas:'Sprint 2: validar flujo de registro de lotes. Reunión viernes con equipo.' },
        { id:'t4', nombre:'Parcial de Estadística',       curso:'Estadística Aplicada', fecha: add(today,-3),   estado:'Vencido',     prioridad:'Crítica', notas:'Distribuciones, intervalos de confianza, regresión lineal.' },
        { id:'t5', nombre:'Presentación de Bases de Datos', curso:'Bases de Datos',    fecha: add(today, 7),   estado:'Pendiente',   prioridad:'Media',  notas:'Modelo ER del sistema de biblioteca. Usar Draw.io.' },
        { id:'t6', nombre:'Taller de Algoritmos',          curso:'Estructuras de Datos', fecha: add(today, 2), estado:'En progreso', prioridad:'Media',  notas:'Implementar árbol AVL en Python. Subir al repositorio antes del viernes.' },
      ];
      localStorage.setItem(key(), JSON.stringify(seed));
    }
  }

  function getAll() {
    return JSON.parse(localStorage.getItem(key()) || '[]');
  }

  function save(tasks) {
    localStorage.setItem(key(), JSON.stringify(tasks));
  }

  function add(data) {
    const tasks = getAll();
    const task = { id: 't' + Date.now(), ...data, createdAt: new Date().toISOString() };
    tasks.push(task);
    save(tasks);
    return task;
  }

  function update(id, data) {
    const tasks = getAll();
    const i = tasks.findIndex(t => t.id === id);
    if (i === -1) return null;
    tasks[i] = { ...tasks[i], ...data, updatedAt: new Date().toISOString() };
    save(tasks);
    return tasks[i];
  }

  function remove(id) {
    const tasks = getAll();
    save(tasks.filter(t => t.id !== id));
  }

  function toggleDone(id) {
    const tasks = getAll();
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    t.estado = t.estado === 'Completado' ? 'Pendiente' : 'Completado';
    t.updatedAt = new Date().toISOString();
    save(tasks);
    return t;
  }

  function getStats() {
    const tasks = getAll();
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

  function getUpcoming(limit = 5) {
    const today = new Date().toISOString().slice(0, 10);
    return getAll()
      .filter(t => t.estado !== 'Completado')
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, limit);
  }

  function getCourseBreakdown() {
    const tasks = getAll();
    const cursos = [...new Set(tasks.map(t => t.curso))];
    return cursos.map(c => ({
      curso: c,
      total: tasks.filter(t => t.curso === c).length,
      done:  tasks.filter(t => t.curso === c && t.estado === 'Completado').length,
    }));
  }

  return { init, getAll, add, update, remove, toggleDone, getStats, getUpcoming, getCourseBreakdown };
})();
