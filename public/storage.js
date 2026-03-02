const STORAGE_KEY = 'payment-dashboard-data-v3';
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const AVAILABLE_YEARS = [2025, 2026, 2027];

function createDefaultState() {
  return {
    year: 2025,
    people: [],
    apps: [],
    paymentsByYear: {
      2025: {},
      2026: {},
      2027: {}
    }
  };
}

function sanitizeText(value) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 80);
}

function sanitizeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? Number(numeric.toFixed(2)) : 0;
}

function normalizeState(input) {
  const state = createDefaultState();
  if (!input || typeof input !== 'object') return state;

  state.year = AVAILABLE_YEARS.includes(input.year) ? input.year : 2025;

  if (Array.isArray(input.people)) {
    state.people = input.people
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({ id: sanitizeText(item.id) || crypto.randomUUID(), name: sanitizeText(item.name) }))
      .filter((item) => item.name);
  }

  if (Array.isArray(input.apps)) {
    state.apps = input.apps
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        id: sanitizeText(item.id) || crypto.randomUUID(),
        name: sanitizeText(item.name),
        amount: sanitizeNumber(item.amount)
      }))
      .filter((item) => item.name);
  }

  const sourceYears = input.paymentsByYear && typeof input.paymentsByYear === 'object' ? input.paymentsByYear : {};

  AVAILABLE_YEARS.forEach((year) => {
    const yearBlock = sourceYears[year] && typeof sourceYears[year] === 'object' ? sourceYears[year] : {};
    state.paymentsByYear[year] = {};

    Object.keys(yearBlock).forEach((personId) => {
      const personPayments = yearBlock[personId];
      if (!personPayments || typeof personPayments !== 'object') return;

      state.paymentsByYear[year][personId] = {};
      Object.keys(personPayments).forEach((appId) => {
        const rawMonths = personPayments[appId];
        const safeMonths = Array.isArray(rawMonths) ? rawMonths.slice(0, 12).map(Boolean) : Array(12).fill(false);
        while (safeMonths.length < 12) safeMonths.push(false);
        state.paymentsByYear[year][personId][appId] = safeMonths;
      });
    });
  });

  return state;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createDefaultState();

  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return createDefaultState();
  }
}

function saveState(state) {
  const normalized = normalizeState(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

function ensurePaymentRow(state, year, personId, appId) {
  if (!state.paymentsByYear[year]) state.paymentsByYear[year] = {};
  if (!state.paymentsByYear[year][personId]) state.paymentsByYear[year][personId] = {};
  if (!Array.isArray(state.paymentsByYear[year][personId][appId])) {
    state.paymentsByYear[year][personId][appId] = Array(12).fill(false);
  }
  return state.paymentsByYear[year][personId][appId];
}
