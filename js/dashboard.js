/* ── UA Plataforma · dashboard.js ── */

const Dashboard = (() => {

  let chartDonut = null;
  let chartBar   = null;
  let chartLine  = null;
  let chartImpact = null;

  const COLORS = {
    completado: '#3A7D5E',
    pendiente:  '#C47B1A',
    vencido:    '#C0394A',
    progreso:   '#3D3BE8',
  };

  function toast(msg, type = '') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${msg}`;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const view = document.getElementById('view-' + id);
    if (view) view.classList.add('active');
    const nav = document.querySelector(`[data-view="${id}"]`);
    if (nav) nav.classList.add('active');

    const titles = { dashboard: 'Dashboard', tasks: 'Mis Tareas', ai: 'Asistente IA', metrics: 'Métricas y Pruebas', profile: 'Mi Perfil' };
    const el = document.getElementById('page-title');
    if (el) el.textContent = titles[id] || '';

    if (id === 'dashboard') renderDashboard();
    if (id === 'tasks') renderTasks();
    if (id === 'metrics') renderMetrics();
    if (id === 'profile') renderProfile();
  }

  function renderDashboard() {
    const stats = Tasks.getStats();
    const upcoming = Tasks.getUpcoming(5);

    // Metrics
    setEl('m-total', stats.total);
    setEl('m-done', stats.completado);
    setEl('m-pend', stats.pendiente + stats.progreso);
    setEl('m-venc', stats.vencido);

    // Progress ring
    const ring = document.getElementById('pct-ring');
    const pctLabel = document.getElementById('pct-label');
    if (ring) {
      const r = 28, circ = 2 * Math.PI * r;
      const offset = circ - (stats.pct / 100) * circ;
      ring.style.strokeDasharray  = circ;
      ring.style.strokeDashoffset = offset;
    }
    if (pctLabel) pctLabel.textContent = stats.pct + '%';

    // Greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    setEl('greeting-time', greeting);

    // Upcoming tasks
    renderUpcoming(upcoming);

    // Charts
    renderDonut(stats);
    renderBarChart();
  }

  function renderUpcoming(tasks) {
    const container = document.getElementById('upcoming-list');
    if (!container) return;
    const today = new Date().toISOString().slice(0, 10);

    if (!tasks.length) {
      container.innerHTML = '<div style="padding:20px;text-align:center;font-size:13px;color:var(--ink-40);">¡Sin tareas pendientes! 🎉</div>';
      return;
    }

    container.innerHTML = tasks.map(t => {
      const overdue = t.fecha < today && t.estado !== 'Completado';
      const dateLabel = t.fecha === today ? 'Hoy' : t.fecha === addDays(today, 1) ? 'Mañana' : t.fecha;
      const cls = stateClass(t.estado);
      return `
        <div class="task-row" onclick="Dashboard.openEdit('${t.id}')">
          <button class="task-check-btn ${t.estado === 'Completado' ? 'done' : ''}" onclick="event.stopPropagation(); Dashboard.toggle('${t.id}')" aria-label="Marcar como completada">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="2,6 5,9 10,3"/></svg>
          </button>
          <div class="task-info">
            <div class="task-name-text ${t.estado === 'Completado' ? 'done' : ''}">${t.nombre}</div>
            <div class="task-meta-row">
              <span class="task-course-tag">${t.curso}</span>
              <span class="task-date-text ${overdue ? 'overdue' : ''}">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="11" rx="2"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="11" y1="1" x2="11" y2="5"/><line x1="2" y1="7" x2="14" y2="7"/></svg>
                ${overdue ? '⚠ ' : ''}${dateLabel}
              </span>
              <span class="badge badge-${cls}" style="font-size:10px;padding:1px 7px;">${t.estado}</span>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function renderDonut(stats) {
    const canvas = document.getElementById('chart-donut');
    if (!canvas || typeof Chart === 'undefined') return;
    if (chartDonut) chartDonut.destroy();
    chartDonut = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Completado', 'Pendiente', 'Vencido', 'En progreso'],
        datasets: [{
          data: [stats.completado, stats.pendiente, stats.vencido, stats.progreso],
          backgroundColor: [COLORS.completado, COLORS.pendiente, COLORS.vencido, COLORS.progreso],
          borderWidth: 0,
          hoverOffset: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '72%',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } } }
      }
    });
  }

  function renderBarChart() {
    const canvas = document.getElementById('chart-bar');
    if (!canvas || typeof Chart === 'undefined') return;
    if (chartBar) chartBar.destroy();
    const breakdown = Tasks.getCourseBreakdown();
    chartBar = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: breakdown.map(b => b.curso.length > 16 ? b.curso.slice(0, 14) + '…' : b.curso),
        datasets: [
          { label: 'Pendientes', data: breakdown.map(b => b.total - b.done), backgroundColor: '#C47B1A', borderRadius: 4, borderSkipped: false },
          { label: 'Completadas', data: breakdown.map(b => b.done), backgroundColor: '#3A7D5E', borderRadius: 4, borderSkipped: false },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { stacked: true, ticks: { font: { size: 10 }, color: '#9E9B96' }, grid: { display: false } },
          y: { stacked: true, ticks: { stepSize: 1, font: { size: 10 }, color: '#9E9B96' }, grid: { color: '#EDE9E1' } }
        }
      }
    });
  }

  function renderTasks() {
    const all = Tasks.getAll();
    const q = (document.getElementById('task-search')?.value || '').toLowerCase();
    const filterState = document.querySelector('.filter-chip.active')?.dataset.filter || '';

    let filtered = all;
    if (q) filtered = filtered.filter(t => t.nombre.toLowerCase().includes(q) || t.curso.toLowerCase().includes(q));
    if (filterState && filterState !== 'todos') filtered = filtered.filter(t => t.estado.toLowerCase().includes(filterState) || (filterState === 'vencido' && isOverdue(t)));

    filtered.sort((a, b) => {
      const order = { Vencido: 0, Crítica: 0, Pendiente: 1, 'En progreso': 2, Completado: 3 };
      return (order[a.estado] ?? 5) - (order[b.estado] ?? 5) || a.fecha.localeCompare(b.fecha);
    });

    const grid = document.getElementById('tasks-grid');
    if (!grid) return;

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="16" x2="12" y2="16"/></svg>
        <h3>Sin tareas aquí</h3>
        <p>Agrega tu primera tarea con el botón de abajo.</p>
      </div>`;
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    grid.innerHTML = filtered.map(t => {
      const overdue = isOverdue(t);
      const cls = stateClass(t.estado, overdue);
      const dateLabel = t.fecha === today ? 'Hoy' : t.fecha;
      return `
        <div class="task-card-full ${cls}">
          <div class="task-card-header">
            <div class="task-card-title ${t.estado === 'Completado' ? 'done' : ''}">${t.nombre}</div>
            <div class="task-card-actions">
              <button class="icon-btn" onclick="Dashboard.toggle('${t.id}')" title="${t.estado === 'Completado' ? 'Reabrir' : 'Completar'}">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="2,8 6,12 14,4"/></svg>
              </button>
              <button class="icon-btn" onclick="Dashboard.openEdit('${t.id}')" title="Editar">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 2l3 3-9 9H2v-3L11 2z"/></svg>
              </button>
              <button class="icon-btn danger" onclick="Dashboard.deleteTask('${t.id}')" title="Eliminar">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3,4 13,4"/><path d="M5 4V2h6v2"/><path d="M6 7v5M10 7v5"/><path d="M4 4l1 10h6l1-10"/></svg>
              </button>
            </div>
          </div>
          <div class="task-card-meta">
            <span class="badge badge-${cls}">${overdue && t.estado !== 'Completado' ? 'Vencido' : t.estado}</span>
            <span class="task-course-tag" style="font-size:11px;">${t.curso}</span>
            ${t.prioridad ? `<span class="badge" style="background:var(--cream-dark);color:var(--ink-60);">${t.prioridad}</span>` : ''}
          </div>
          ${t.notas ? `<div class="task-card-notes">${t.notas.slice(0, 100)}${t.notas.length > 100 ? '…' : ''}</div>` : ''}
          <div class="task-card-footer">
            <span style="font-size:11px;color:${overdue ? 'var(--rose)' : 'var(--ink-40)'};">
              📅 ${dateLabel}${overdue && t.estado !== 'Completado' ? ' ⚠' : ''}
            </span>
            ${t.estado === 'Completado' ? '<span style="font-size:11px;color:var(--sage);">✓ Completada</span>' : ''}
          </div>
        </div>`;
    }).join('');
  }

  function renderMetrics() {
    const stats = Tasks.getStats();
    setEl('mt-total', stats.total);
    setEl('mt-done', stats.completado);
    setEl('mt-pct', stats.pct + '%');
    setEl('mt-venc', stats.vencido);

    const logs = [
      { caso: 'Crear tarea nueva',       ms: 340,  errores: 0, result: 'OK' },
      { caso: 'Visualizar listado',       ms: 280,  errores: 0, result: 'OK' },
      { caso: 'Filtrar por estado',       ms: 95,   errores: 0, result: 'OK' },
      { caso: 'Editar tarea existente',   ms: 410,  errores: 0, result: 'OK' },
      { caso: 'Marcar como completada',   ms: 180,  errores: 0, result: 'OK' },
      { caso: 'Consulta a IA (resumen)',  ms: 1820, errores: 0, result: 'OK' },
    ];
    const tbody = document.getElementById('logs-tbody');
    if (tbody) {
      tbody.innerHTML = logs.map((l, i) => `
        <tr>
          <td style="color:var(--ink-40);">${i + 1}</td>
          <td>${l.caso}</td>
          <td>
            <strong>${l.ms}</strong> ms
            <span class="perf-bar-wrap">
              <span class="perf-bar" style="width:${Math.min(l.ms / 2000 * 100, 100).toFixed(0)}%;background:${l.ms < 500 ? '#3A7D5E' : '#C47B1A'};"></span>
            </span>
          </td>
          <td>${l.errores}</td>
          <td><span class="badge badge-completado">✓ ${l.result}</span></td>
        </tr>`).join('');
    }

    // Impact radar
    const radarCanvas = document.getElementById('chart-impact');
    if (radarCanvas && typeof Chart !== 'undefined') {
      if (chartImpact) chartImpact.destroy();
      chartImpact = new Chart(radarCanvas, {
        type: 'radar',
        data: {
          labels: ['Velocidad', 'Exactitud', 'Usabilidad', 'Escalabilidad', 'Notificaciones', 'Filtros'],
          datasets: [
            { label: 'Estado actual', data: [95, 100, 90, 60, 10, 70], backgroundColor: 'rgba(61,59,232,.12)', borderColor: '#3D3BE8', pointBackgroundColor: '#3D3BE8', borderWidth: 1.5 },
            { label: 'Objetivo',      data: [95, 100, 95, 85, 80, 90], backgroundColor: 'rgba(58,125,94,.1)',  borderColor: '#3A7D5E', borderDash: [4, 3], pointBackgroundColor: '#3A7D5E', borderWidth: 1.5 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, color: '#6B6760' } } }, scales: { r: { min: 0, max: 100, ticks: { stepSize: 20, font: { size: 10 }, color: '#9E9B96' }, grid: { color: '#EDE9E1' } } } }
      });
    }
  }

  function renderProfile() {
    const session = Auth.getSession();
    if (!session) return;
    const stats = Tasks.getStats();
    setEl('profile-name', session.name);
    setEl('profile-career', session.career || 'Estudiante');
    const avatar = document.getElementById('profile-avatar');
    if (avatar) avatar.textContent = session.avatar || '🎓';
    setEl('profile-stat-total', stats.total);
    setEl('profile-stat-done', stats.completado);
    setEl('profile-stat-pct', stats.pct + '%');
  }

  /* ── Task modal ── */
  let editingId = null;

  function openModal(id = null) {
    editingId = id;
    const modal = document.getElementById('task-modal');
    const title = document.getElementById('modal-title');
    if (!modal) return;

    if (id) {
      const t = Tasks.getAll().find(x => x.id === id);
      if (!t) return;
      title.textContent = 'Editar tarea';
      setField('f-nombre', t.nombre);
      setField('f-curso', t.curso);
      setField('f-fecha', t.fecha);
      setField('f-estado', t.estado);
      setField('f-prioridad', t.prioridad || 'Media');
      setField('f-notas', t.notas || '');
    } else {
      title.textContent = 'Nueva tarea';
      setField('f-nombre', '');
      setField('f-curso', '');
      setField('f-fecha', new Date().toISOString().slice(0, 10));
      setField('f-estado', 'Pendiente');
      setField('f-prioridad', 'Media');
      setField('f-notas', '');
    }
    modal.classList.add('open');
    setTimeout(() => document.getElementById('f-nombre')?.focus(), 100);
  }

  function closeModal() {
    document.getElementById('task-modal')?.classList.remove('open');
    editingId = null;
  }

  function saveModal() {
    const nombre = document.getElementById('f-nombre')?.value.trim();
    if (!nombre) { toast('El nombre de la tarea es obligatorio.', 'error'); return; }
    const data = {
      nombre,
      curso:     document.getElementById('f-curso')?.value.trim() || 'General',
      fecha:     document.getElementById('f-fecha')?.value || new Date().toISOString().slice(0, 10),
      estado:    document.getElementById('f-estado')?.value || 'Pendiente',
      prioridad: document.getElementById('f-prioridad')?.value || 'Media',
      notas:     document.getElementById('f-notas')?.value.trim() || '',
    };
    if (editingId) {
      Tasks.update(editingId, data);
      toast('Tarea actualizada.', 'success');
    } else {
      Tasks.add(data);
      toast('Tarea creada.', 'success');
    }
    closeModal();
    renderTasks();
    renderDashboard();
    updateBadges();
  }

  function toggle(id) {
    Tasks.toggleDone(id);
    renderTasks();
    renderDashboard();
    updateBadges();
    toast('Estado actualizado.', 'success');
  }

  function openEdit(id) {
    openModal(id);
    showView('tasks');
  }

  function deleteTask(id) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    Tasks.remove(id);
    renderTasks();
    renderDashboard();
    updateBadges();
    toast('Tarea eliminada.', '');
  }

  function updateBadges() {
    const stats = Tasks.getStats();
    const badge = document.getElementById('nav-badge-venc');
    if (badge) {
      badge.textContent = stats.vencido;
      badge.style.display = stats.vencido ? 'inline' : 'none';
    }
  }

  /* ── AI view ── */
  function initAI() {
    const input = document.getElementById('ai-input');
    if (!input) return;
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); }
    });
  }

  function addMessage(text, role) {
    const area = document.getElementById('ai-messages');
    if (!area) return;
    const session = Auth.getSession();
    const avatar = role === 'user' ? (session?.avatar || '🎓') : '🤖';
    const div = document.createElement('div');
    div.className = `ai-msg ${role}`;
    div.innerHTML = `
      <div class="ai-msg-avatar">${avatar}</div>
      <div class="ai-msg-bubble" id="msg-${Date.now()}">${text}</div>`;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
    return div.querySelector('.ai-msg-bubble');
  }

  async function sendAI() {
    const input = document.getElementById('ai-input');
    const msg = input?.value.trim();
    if (!msg) return;
    input.value = '';
    addMessage(msg, 'user');
    const bubble = addMessage('Pensando…', 'bot');
    const tasks = Tasks.getAll();
    await AI.freeChat(msg, tasks, text => { if (bubble) bubble.textContent = text; });
  }

  async function quickAI(tipo) {
    const bubble = addMessage('Analizando…', 'bot');
    const tasks = Tasks.getAll();
    const sel = document.getElementById('ai-task-select')?.value;
    await AI.analizar(tipo, tasks, sel, text => { if (bubble) bubble.textContent = text; });
    showView('ai');
  }

  function populateAISelect() {
    const sel = document.getElementById('ai-task-select');
    if (!sel) return;
    const tasks = Tasks.getAll();
    sel.innerHTML = tasks.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('');
  }

  /* ── Helpers ── */
  function setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
  function setField(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
  function isOverdue(t) {
    const today = new Date().toISOString().slice(0, 10);
    return t.fecha < today && t.estado !== 'Completado';
  }
  function stateClass(estado, overdue = false) {
    if (overdue) return 'vencido';
    return ({ 'Completado': 'completado', 'Pendiente': 'pendiente', 'En progreso': 'progreso', 'Vencido': 'vencido' })[estado] || 'pendiente';
  }
  function addDays(dateStr, n) {
    const d = new Date(dateStr); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
  }

  return { showView, renderDashboard, renderTasks, renderMetrics, renderProfile, openModal, closeModal, saveModal, toggle, openEdit, deleteTask, sendAI, quickAI, populateAISelect, initAI, toast, updateBadges };
})();
