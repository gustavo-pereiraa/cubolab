const STORAGE_KEY = 'cubolab.solves.v1';
const PENALTIES = [null, '+2', 'DNF'];
const SPLIT_KEYS = ['cross', 'firstLayer', 'secondLayer', 'lastLayer'];

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

function isValidSolve(solve) {
  if (!solve || typeof solve !== 'object') return false;
  const { id, date, scramble, totalMs, splits, penalty } = solve;
  return (
    typeof id === 'string' &&
    !Number.isNaN(Date.parse(date)) &&
    typeof scramble === 'string' &&
    isFiniteNumber(totalMs) &&
    totalMs >= 0 &&
    PENALTIES.includes(penalty) &&
    (splits === null || SPLIT_KEYS.every((key) => isFiniteNumber(splits?.[key])))
  );
}

const byDate = (a, b) => Date.parse(a.date) - Date.parse(b.date);

/**
 * Lê e grava as resoluções, da mais antiga para a mais recente. Dados corrompidos são ignorados
 * e, se o navegador bloquear o armazenamento, o app segue funcionando só nesta sessão.
 */
export function createSolveStore(storage = globalThis.localStorage) {
  function load() {
    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY));
      return Array.isArray(parsed) ? parsed.filter(isValidSolve).sort(byDate) : [];
    } catch {
      return [];
    }
  }

  let solves = load();
  let isPersistent = true;

  function save() {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(solves));
      isPersistent = true;
    } catch {
      isPersistent = false;
    }
  }

  return {
    getAll: () => solves,
    isPersistent: () => isPersistent,

    add({ scramble, totalMs, splits, date = new Date().toISOString() }) {
      const solve = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, date, scramble, totalMs, splits, penalty: null };
      solves = [...solves, solve].sort(byDate);
      save();
      return solve;
    },

    addAll(list) {
      solves = [...solves, ...list].sort(byDate);
      save();
    },

    remove(id) {
      solves = solves.filter((solve) => solve.id !== id);
      save();
    },

    removeWhere(predicate) {
      solves = solves.filter((solve) => !predicate(solve));
      save();
    },

    setPenalty(id, penalty) {
      solves = solves.map((solve) => (solve.id === id ? { ...solve, penalty } : solve));
      save();
    },
  };
}
