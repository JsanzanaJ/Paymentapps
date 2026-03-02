let adminState = loadState();

const adminRefs = {
  yearSelect: document.getElementById('yearSelect'),
  personForm: document.getElementById('personForm'),
  personName: document.getElementById('personName'),
  appForm: document.getElementById('appForm'),
  appName: document.getElementById('appName'),
  appAmount: document.getElementById('appAmount'),
  peopleTags: document.getElementById('peopleTags'),
  appsTags: document.getElementById('appsTags'),
  adminTableBody: document.getElementById('adminTableBody')
};

function currency(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value);
}

function drawYearSelect() {
  adminRefs.yearSelect.innerHTML = '';
  AVAILABLE_YEARS.forEach((year) => {
    const option = document.createElement('option');
    option.value = String(year);
    option.textContent = String(year);
    option.selected = year === adminState.year;
    adminRefs.yearSelect.appendChild(option);
  });
}

function removePerson(personId) {
  adminState.people = adminState.people.filter((person) => person.id !== personId);

  AVAILABLE_YEARS.forEach((year) => {
    if (adminState.paymentsByYear?.[year]?.[personId]) {
      delete adminState.paymentsByYear[year][personId];
    }
  });

  saveState(adminState);
  drawTags();
  drawTable();
}

function removeApp(appId) {
  adminState.apps = adminState.apps.filter((app) => app.id !== appId);

  AVAILABLE_YEARS.forEach((year) => {
    const yearPayments = adminState.paymentsByYear?.[year];
    if (!yearPayments) return;

    Object.keys(yearPayments).forEach((personId) => {
      if (yearPayments[personId]?.[appId]) {
        delete yearPayments[personId][appId];
      }
    });
  });

  saveState(adminState);
  drawTags();
  drawTable();
}

function drawTags() {
  adminRefs.peopleTags.innerHTML = '';
  adminRefs.appsTags.innerHTML = '';

  adminState.people.forEach((person) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${person.name}</span>`;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'tag-remove';
    removeButton.textContent = '✕';
    removeButton.title = `Eliminar persona ${person.name}`;
    removeButton.addEventListener('click', () => removePerson(person.id));

    li.appendChild(removeButton);
    adminRefs.peopleTags.appendChild(li);
  });

  adminState.apps.forEach((app) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${app.name} · ${currency(app.amount)}</span>`;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'tag-remove';
    removeButton.textContent = '✕';
    removeButton.title = `Eliminar aplicación ${app.name}`;
    removeButton.addEventListener('click', () => removeApp(app.id));

    li.appendChild(removeButton);
    adminRefs.appsTags.appendChild(li);
  });
}

function drawTable() {
  adminRefs.adminTableBody.innerHTML = '';

  if (!adminState.people.length || !adminState.apps.length) {
    adminRefs.adminTableBody.innerHTML = '<tr><td colspan="15" class="muted">Agrega personas y aplicaciones para comenzar.</td></tr>';
    return;
  }

  adminState.people.forEach((person) => {
    adminState.apps.forEach((app) => {
      const months = ensurePaymentRow(adminState, adminState.year, person.id, app.id);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${person.name}</td><td>${app.name}</td><td>${currency(app.amount)}</td>`;

      MONTHS.forEach((_, monthIndex) => {
        const td = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'month-checkbox';
        checkbox.checked = Boolean(months[monthIndex]);

        checkbox.addEventListener('change', () => {
          months[monthIndex] = checkbox.checked;
          saveState(adminState);
        });

        td.appendChild(checkbox);
        tr.appendChild(td);
      });

      adminRefs.adminTableBody.appendChild(tr);
    });
  });

  saveState(adminState);
}

adminRefs.yearSelect.addEventListener('change', () => {
  adminState.year = Number(adminRefs.yearSelect.value);
  saveState(adminState);
  drawTable();
});

adminRefs.personForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = sanitizeText(adminRefs.personName.value);
  if (!name) return;

  adminState.people.push({ id: crypto.randomUUID(), name });
  saveState(adminState);
  adminRefs.personForm.reset();
  drawTags();
  drawTable();
});

adminRefs.appForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = sanitizeText(adminRefs.appName.value);
  const amount = Number(adminRefs.appAmount.value);

  if (!name || Number.isNaN(amount) || amount < 0) return;

  adminState.apps.push({ id: crypto.randomUUID(), name, amount: sanitizeNumber(amount) });
  saveState(adminState);
  adminRefs.appForm.reset();
  drawTags();
  drawTable();
});

window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  adminState = loadState();
  drawYearSelect();
  drawTags();
  drawTable();
});

drawYearSelect();
drawTags();
drawTable();
