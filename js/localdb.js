// A tiny stand-in for Firestore that keeps everything in this browser (localStorage).
// Used when Firebase can't be reached, so the game still works on one device. It speaks the
// same small slice of the Firestore API the game uses: doc/collection, get/set/update/delete,
// add, where/orderBy/limit, and onSnapshot with docChanges().
const LocalDB = (() => {
  const PF = "olw:";
  const read = p => { try { const v = localStorage.getItem(PF + p); return v == null ? null : JSON.parse(v); } catch (e) { return null; } };
  const keys = () => { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PF)) out.push(k.slice(PF.length)); } } catch (e) {} return out; };
  const subs = new Set();
  const copy = d => d == null ? undefined : JSON.parse(JSON.stringify(d));
  const snapOf = (path, data, pending) => ({ id: path.split("/").pop(), exists: data != null, data: () => copy(data), metadata: { hasPendingWrites: !!pending } });
  const emit = (path, data, pending) => subs.forEach(s => s(path, data, pending));
  function write(path, data) {
    try { if (data == null) localStorage.removeItem(PF + path); else localStorage.setItem(PF + path, JSON.stringify(data)); }
    catch (e) { return Promise.reject(Object.assign(new Error("Storage is full"), { code: "resource-exhausted" })); }
    emit(path, data, true); return Promise.resolve();
  }
  addEventListener("storage", e => {
    if (!e.key || !e.key.startsWith(PF)) return;
    emit(e.key.slice(PF.length), e.newValue == null ? null : JSON.parse(e.newValue), false);
  });
  const isObj = v => v && typeof v === "object" && !Array.isArray(v);
  const merge = (a, b) => { const o = { ...(a || {}) }; for (const k in b) o[k] = isObj(b[k]) && isObj(o[k]) ? merge(o[k], b[k]) : b[k]; return o; };
  const rid = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4);

  function docRef(path) {
    return {
      id: path.split("/").pop(), path,
      get: () => Promise.resolve(snapOf(path, read(path))),
      set: (d, o) => write(path, o && o.merge ? merge(read(path), d) : d),
      update: d => read(path) == null ? Promise.reject(Object.assign(new Error("No document"), { code: "not-found" })) : write(path, merge(read(path), d)),
      delete: () => write(path, null),
      onSnapshot: cb => {
        const s = (p, d, pend) => { if (p === path) cb(snapOf(p, d, pend)); };
        subs.add(s); setTimeout(() => cb(snapOf(path, read(path))), 0); return () => subs.delete(s);
      }
    };
  }
  function query(col, q) {
    const inCol = p => p.startsWith(col + "/") && p.split("/").length === 2;
    const run = () => {
      let d = keys().filter(inCol).map(p => snapOf(p, read(p)));
      for (const [f, v] of q.where) d = d.filter(s => (s.data() || {})[f] === v);
      if (q.order) { const [f, dir] = q.order, A = s => (s.data() || {})[f] ?? 0; d.sort((a, b) => (A(a) > A(b) ? 1 : A(a) < A(b) ? -1 : 0) * (dir === "desc" ? -1 : 1)); }
      return q.lim ? d.slice(0, q.lim) : d;
    };
    const qs = (docs, changes) => ({ docs, size: docs.length, empty: !docs.length, forEach: f => docs.forEach(f), docChanges: () => changes });
    return {
      where: (f, op, v) => query(col, { ...q, where: [...q.where, [f, v]] }),
      orderBy: (f, dir = "asc") => query(col, { ...q, order: [f, dir] }),
      limit: n => query(col, { ...q, lim: n }),
      get: () => Promise.resolve(qs(run(), [])),
      onSnapshot: cb => {
        let prev = new Set();
        const s = (p, d, pend) => {
          if (!inCol(p)) return;
          const docs = run(), id = p.split("/")[1], now = docs.some(x => x.id === id), was = prev.has(id);
          prev = new Set(docs.map(x => x.id));
          if (!now && !was) return;
          cb(qs(docs, [{ type: !now ? "removed" : !was ? "added" : "modified", doc: snapOf(p, d, pend) }]));
        };
        subs.add(s);
        setTimeout(() => { const docs = run(); prev = new Set(docs.map(x => x.id)); cb(qs(docs, docs.map(doc => ({ type: "added", doc })))); }, 0);
        return () => subs.delete(s);
      }
    };
  }
  return {
    local: true,
    doc: p => docRef(p),
    collection: name => ({
      ...query(name, { where: [] }),
      doc: id => docRef(name + "/" + (id || rid())),
      add: d => { const r = docRef(name + "/" + rid()); return r.set(d).then(() => r); }
    })
  };
})();
