let viewerState = loadState();

const viewerRefs = {
  yearSelect: document.getElementById('yearSelect'),
  appButtons: document.getElementById('appButtons'),
  peopleGrid: document.getElementById('peopleGrid')
};

const APP_THEMES = {
  youtube: { primary: '#dc2626', soft: '#fee2e2', accent: '#991b1b' },
  netflix: { primary: '#111111', soft: '#fecaca', accent: '#b91c1c' },
  crunchyroll: { primary: '#f97316', soft: '#ffedd5', accent: '#c2410c' }
};

let selectedAppId = '';

function getThemeByAppName(appName) {
  const key = appName.trim().toLowerCase();
  return APP_THEMES[key] ?? { primary: '#2563eb', soft: '#dbeafe', accent: '#1d4ed8' };
}

function applyAppTheme(app) {
  const theme = getThemeByAppName(app.name);
  document.body.style.setProperty('--primary', theme.primary);
  document.body.style.setProperty('--primary-soft', theme.soft);
  document.body.style.setProperty('--app-accent', theme.accent);
}

function renderYearSelect() {
  viewerRefs.yearSelect.innerHTML = '';

  AVAILABLE_YEARS.forEach((year) => {
    const option = document.createElement('option');
    option.value = String(year);
    option.textContent = String(year);
    option.selected = year === viewerState.year;
    viewerRefs.yearSelect.appendChild(option);
  });
}

function renderPeopleGrid() {
  viewerRefs.peopleGrid.innerHTML = '';

  if (!selectedAppId) {
    viewerRefs.peopleGrid.innerHTML = '<p class="muted">Selecciona una aplicación para visualizar pagos.</p>';
    return;
  }

  if (!viewerState.people.length) {
    viewerRefs.peopleGrid.innerHTML = '<p class="muted">No hay personas registradas todavía.</p>';
    return;
  }

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrap';

  const table = document.createElement('table');
  table.className = 'table people-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = `<th>Persona</th>${MONTHS.map((month) => `<th>${month}</th>`).join('')}`;
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');

  viewerState.people.forEach((person) => {
    const months = ensurePaymentRow(viewerState, viewerState.year, person.id, selectedAppId);
    const row = document.createElement('tr');

    row.innerHTML = `
      <td class="person-name-cell">${person.name}</td>
      ${MONTHS.map((_, index) => {
        const paid = Boolean(months[index]);
        return `<td><span class="status-chip ${paid ? 'paid' : 'pending'}">${paid ? 'Pagado' : 'Pendiente'}</span></td>`;
      }).join('')}
    `;

    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  viewerRefs.peopleGrid.appendChild(tableWrap);
}

function renderAppButtons() {
  viewerRefs.appButtons.innerHTML = '';

  if (!viewerState.apps.length) {
    viewerRefs.appButtons.innerHTML = '<p class="muted">No hay aplicaciones registradas.</p>';
    renderPeopleGrid();
    return;
  }

  if (!viewerState.apps.some((app) => app.id === selectedAppId)) {
    selectedAppId = viewerState.apps[0].id;
  }

  viewerState.apps.forEach((app) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = app.name;
    button.classList.toggle('active', app.id === selectedAppId);

    button.addEventListener('click', () => {
      selectedAppId = app.id;
      renderAppButtons();
      renderPeopleGrid();
    });

    viewerRefs.appButtons.appendChild(button);
  });

  const selectedApp = viewerState.apps.find((app) => app.id === selectedAppId);
  if (selectedApp) applyAppTheme(selectedApp);

  renderPeopleGrid();
}

viewerRefs.yearSelect.addEventListener('change', () => {
  viewerState.year = Number(viewerRefs.yearSelect.value);
  saveState(viewerState);
  renderPeopleGrid();
});

window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  viewerState = loadState();
  renderYearSelect();
  renderAppButtons();
});

renderYearSelect();
renderAppButtons();
