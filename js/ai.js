/* ── UA Plataforma · ai.js ── */

const AI = (() => {

  const API = 'https://api.anthropic.com/v1/messages';
  const MODEL = 'claude-sonnet-4-20250514';

  async function ask(prompt, onChunk) {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      const text = (data.content || []).map(b => b.text || '').join('');
      if (onChunk) onChunk(text);
      return text;
    } catch (e) {
      const msg = 'No se pudo conectar con la IA. Verifica tu conexión.';
      if (onChunk) onChunk(msg);
      return msg;
    }
  }

  function buildContext(tasks) {
    const stats = tasks.length;
    const done  = tasks.filter(t => t.estado === 'Completado').length;
    const pend  = tasks.filter(t => t.estado === 'Pendiente').length;
    const venc  = tasks.filter(t => t.estado === 'Vencido').length;
    const today = new Date().toISOString().slice(0, 10);
    return `Eres un asistente académico amigable y directo. El estudiante tiene ${stats} tareas: ${done} completadas, ${pend} pendientes, ${venc} vencidas. Fecha actual: ${today}. Lista de tareas: ${JSON.stringify(tasks.map(t => ({ nombre: t.nombre, curso: t.curso, estado: t.estado, fecha: t.fecha, prioridad: t.prioridad })))}. Responde en español, de forma concisa y útil (máx 150 palabras).`;
  }

  async function analizar(tipo, tasks, tareaId, onChunk) {
    const tarea = tasks.find(t => t.id === tareaId);
    const ctx   = buildContext(tasks);
    let prompt;

    switch (tipo) {
      case 'resumen':
        if (!tarea) { onChunk('Selecciona una tarea primero.'); return; }
        prompt = `${ctx}\n\nGenera un resumen ejecutivo de 3 oraciones para la tarea "${tarea.nombre}" del curso "${tarea.curso}" (estado: ${tarea.estado}, fecha: ${tarea.fecha}). Apuntes: "${tarea.notas || 'ninguno'}". Incluye un plan de acción de 2 pasos.`;
        break;
      case 'tips':
        if (!tarea) { onChunk('Selecciona una tarea primero.'); return; }
        prompt = `${ctx}\n\nDa exactamente 3 tips de estudio concretos y accionables para completar "${tarea.nombre}" en el curso "${tarea.curso}". Apuntes disponibles: "${tarea.notas || 'ninguno'}". Usa viñetas.`;
        break;
      case 'carga':
        prompt = `${ctx}\n\nAnaliza la carga académica actual del estudiante. Identifica qué cursos tienen más pendientes, qué debe priorizar esta semana, y da 2 recomendaciones de productividad específicas.`;
        break;
      case 'vencidas':
        prompt = `${ctx}\n\nEl estudiante tiene tareas vencidas. Dile cómo manejar esto: qué recuperar primero, cómo hablar con el profesor, y cómo evitar que vuelva a pasar. Sé empático pero directo.`;
        break;
      default:
        prompt = `${ctx}\n\nPregunta del estudiante: ${tipo}`;
    }
    await ask(prompt, onChunk);
  }

  async function freeChat(message, tasks, onChunk) {
    const ctx = buildContext(tasks);
    await ask(`${ctx}\n\nPregunta del estudiante: ${message}`, onChunk);
  }

  return { analizar, freeChat };
})();
