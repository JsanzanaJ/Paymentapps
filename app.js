const STORAGE_KEY = 'payment-dashboard-data-v1';
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const state = {
  year: new Date().getFullYear(),
  people: [],
  subscriptions: []
};

const refs = {
  yearLabel: document.getElementById('yearLabel'),
  personForm: document.getElementById('personForm'),
  personName: document.getElementById('personName'),
  peopleList: document.getElementById('peopleList'),
  personSelect: document.getElementById('personSelect'),
  subscriptionForm: document.getElementById('subscriptionForm'),
  appName: document.getElementById('appName'),
  monthlyAmount: document.getElementById('monthlyAmount'),
  paymentsTableBody: document.getElementById('paymentsTableBody'),
  paidTotal: document.getElementById('paidTotal'),
  pendingTotal: document.getElementById('pendingTotal')
};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.people = parsed.people ?? [];
    state.subscriptions = parsed.subscriptions ?? [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      people: state.people,
      subscriptions: state.subscriptions
    })
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value);
}

function renderPeople() {
  refs.peopleList.innerHTML = '';

  state.people.forEach((person) => {
    const chip = document.createElement('li');
    chip.textContent = person.name;
    refs.peopleList.appendChild(chip);
  });

  refs.personSelect.innerHTML = '<option value="">Selecciona una persona</option>';

  state.people.forEach((person) => {
    const option = document.createElement('option');
    option.value = person.id;
    option.textContent = person.name;
    refs.personSelect.appendChild(option);
  });
}

function renderTable() {
  refs.paymentsTableBody.innerHTML = '';

  if (!state.subscriptions.length) {
    refs.paymentsTableBody.innerHTML = '<tr class="empty-row"><td colspan="15">Todavía no hay pagos registrados.</td></tr>';
    refs.paidTotal.textContent = formatMoney(0);
    refs.pendingTotal.textContent = formatMoney(0);
    return;
  }

  let paidTotal = 0;
  let pendingTotal = 0;

  state.subscriptions.forEach((sub) => {
    const person = state.people.find((p) => p.id === sub.personId);
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${person?.name ?? 'Persona eliminada'}</td>
      <td>${sub.appName}</td>
      <td>${formatMoney(sub.monthlyAmount)}</td>
    `;

    MONTHS.forEach((_, monthIndex) => {
      const cell = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'month-checkbox';
      checkbox.checked = Boolean(sub.paidMonths[monthIndex]);

      checkbox.addEventListener('change', () => {
        sub.paidMonths[monthIndex] = checkbox.checked;
        saveState();
        renderTable();
      });

      if (checkbox.checked) {
        paidTotal += sub.monthlyAmount;
      } else {
        pendingTotal += sub.monthlyAmount;
      }

      cell.appendChild(checkbox);
      row.appendChild(cell);
    });

    refs.paymentsTableBody.appendChild(row);
  });

  refs.paidTotal.textContent = formatMoney(paidTotal);
  refs.pendingTotal.textContent = formatMoney(pendingTotal);
}

refs.personForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = refs.personName.value.trim();

  if (!name) return;

  state.people.push({
    id: crypto.randomUUID(),
    name
  });

  refs.personForm.reset();
  saveState();
  renderPeople();
  renderTable();
});

refs.subscriptionForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const appName = refs.appName.value.trim();
  const personId = refs.personSelect.value;
  const monthlyAmount = Number(refs.monthlyAmount.value);

  if (!appName || !personId || Number.isNaN(monthlyAmount) || monthlyAmount < 0) {
    return;
  }

  state.subscriptions.push({
    id: crypto.randomUUID(),
    appName,
    personId,
    monthlyAmount,
    paidMonths: Array(12).fill(false)
  });

  refs.subscriptionForm.reset();
  saveState();
  renderTable();
});

function init() {
  refs.yearLabel.textContent = state.year;
  loadState();
  renderPeople();
  renderTable();
}

init();
