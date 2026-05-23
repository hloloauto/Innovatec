/* ── UA Plataforma · auth.js ── */

const Auth = (() => {

  const USERS_KEY = 'ua_users';
  const SESSION_KEY = 'ua_session';

  const DEMO_USERS = [
    {
      id: 'u1',
      name: 'Javier Gaitán',
      email: 'javier@universidad.edu',
      password: 'demo1234',
      avatar: '🎓',
      career: 'Ing. de Sistemas',
      joined: '2025-03-01'
    },
    {
      id: 'u2',
      name: 'Ximena García',
      email: 'ximena@universidad.edu',
      password: 'demo1234',
      avatar: '📚',
      career: 'Administración',
      joined: '2025-03-01'
    }
  ];

  function getUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
      return DEMO_USERS;
    }
    return JSON.parse(raw);
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSession() {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function saveSession(user, remember = false) {
    const session = { userId: user.id, name: user.name, avatar: user.avatar, career: user.career };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  function login(email, password, remember = false) {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { ok: false, error: 'No existe una cuenta con ese correo.' };
    if (user.password !== password) return { ok: false, error: 'Contraseña incorrecta. Intenta de nuevo.' };
    saveSession(user, remember);
    return { ok: true, user };
  }

  function register(data) {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { ok: false, error: 'Ya existe una cuenta con ese correo.' };
    }
    if (data.password.length < 6) {
      return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    const user = {
      id: 'u' + Date.now(),
      name: data.name,
      email: data.email,
      password: data.password,
      avatar: data.avatar || '🎓',
      career: data.career || 'Estudiante',
      joined: new Date().toISOString().slice(0, 10)
    };
    users.push(user);
    saveUsers(users);
    saveSession(user, false);
    return { ok: true, user };
  }

  function requireAuth() {
    const session = getSession();
    if (!session) {
      window.location.href = 'index.html';
      return null;
    }
    return session;
  }

  function logout() {
    clearSession();
    window.location.href = 'index.html';
  }

  return { login, register, requireAuth, logout, getSession };
})();
