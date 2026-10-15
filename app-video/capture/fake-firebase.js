/* Firestore falso em memória (API "compat" mínima usada pelo app ENEM Games).
   Serve para gravar as telas do app com dados de demonstração, sem tocar no banco real.
   window.__fs.set(path, data) / .del(path) / .get(path) controlam os dados pelo script de captura. */
(function () {
  const cols = {}; // coleção -> Map(id -> dados)
  const listeners = []; // {col, cb, order}
  const col = (name) => (cols[name] = cols[name] || new Map());
  function snapshot(name, order) {
    let docs = [...col(name).entries()].map(([id, d]) => ({ id, data: () => JSON.parse(JSON.stringify(d)) }));
    if (order) docs.sort((a, b) => (a.data()[order] > b.data()[order] ? 1 : -1));
    return { docs };
  }
  let pending = false;
  function notify() {
    if (pending) return; pending = true;
    Promise.resolve().then(() => { pending = false; listeners.forEach((l) => l.cb(snapshot(l.col, l.order))); });
  }
  function split(path) { const [c, id] = path.split('/'); return [c, id]; }
  function docRef(path) {
    const [c, id] = split(path);
    return {
      get: async () => ({ exists: col(c).has(id), data: () => col(c).get(id) }),
      set: async (d) => { col(c).set(id, JSON.parse(JSON.stringify(d))); notify(); },
      update: async (d) => { col(c).set(id, Object.assign({}, col(c).get(id) || {}, d)); notify(); },
      delete: async () => { col(c).delete(id); notify(); },
      _path: path,
    };
  }
  function collection(name) {
    const q = (order) => ({
      orderBy: (f) => q(f),
      onSnapshot: (cb) => { listeners.push({ col: name, cb, order }); setTimeout(() => cb(snapshot(name, order)), 0); return () => {}; },
    });
    return q(null);
  }
  const db = {
    doc: docRef,
    collection,
    batch: () => { const ops = []; return { set: (ref, d) => ops.push([ref, d]), commit: async () => { for (const [r, d] of ops) await r.set(d); } }; },
  };
  if (window.__SEED) Object.entries(window.__SEED).forEach(([path, d]) => { const [c, id] = split(path); col(c).set(id, d); });
  window.firebase = { initializeApp: () => ({}), firestore: () => db };
  window.__fs = {
    set: (path, d) => { const [c, id] = split(path); col(c).set(id, d); notify(); },
    del: (path) => { const [c, id] = split(path); col(c).delete(id); notify(); },
    clear: (c) => { col(c).clear(); notify(); },
    get: (path) => { const [c, id] = split(path); return col(c).get(id); },
    all: (c) => [...col(c).entries()],
  };
})();
