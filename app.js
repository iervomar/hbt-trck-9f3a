const STORAGE_KEY = "weekly-focus-db";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

let editMode = false;

/* ------------------ UTIL ------------------ */

function getWeekNumber(d = new Date()) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const currentWeek = getWeekNumber();
const lastWeek = currentWeek - 1;

document.getElementById("week").textContent = currentWeek;

/* ------------------ DB ------------------ */

function loadDB() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);

  return {
    habits: [
      { id: "med", name: "Meditation", target: 3 },
      { id: "read", name: "Reading", target: 5 }
    ],
    weeks: {}
  };
}

function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function ensureWeek(db, week, habitId) {
  if (!db.weeks[week]) db.weeks[week] = { _targets: {} };
  if (!db.weeks[week][habitId]) {
    db.weeks[week][habitId] = Array(7).fill(false);
  }
  if (!(habitId in db.weeks[week]._targets)) {
    const habit = db.habits.find(h => h.id === habitId);
    db.weeks[week]._targets[habitId] = habit.target;
  }
}

/* ------------------ RENDER ------------------ */

function render() {
  const db = loadDB();
  const app = document.getElementById("app");
  app.innerHTML = "";

  if (editMode) {
    renderEditMode(db, app);
  } else {
    renderNormalMode(db, app);
  }
}

function renderNormalMode(db, app) {
  const table = document.createElement("table");

  // Header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `
    <th></th>
    ${DAYS.map(d => `<th>${d}</th>`).join("")}
    <th>This</th>
    <th>Prev</th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  db.habits.forEach(habit => {
    ensureWeek(db, currentWeek, habit.id);

    const checks = db.weeks[currentWeek][habit.id];
    const count = checks.filter(Boolean).length;
    const success = count >= habit.target;

    const prevChecks = db.weeks[lastWeek]?.[habit.id] || [];
    const prevTarget = db.weeks[lastWeek]?._targets?.[habit.id];
    const prevCount = prevChecks.filter(Boolean).length;
    const prevSuccess = prevTarget && prevCount >= prevTarget;

    const tr = document.createElement("tr");
    tr.className = success ? "success" : "pending";

    tr.innerHTML = `
      <td class="habit-name">${habit.name}</td>
      ${checks.map((v, i) => `
        <td>
          <div class="checkbox ${v ? "checked" : ""}"></div>
        </td>
      `).join("")}
      <td class="counter ${success ? "success" : "pending"}">${count}</td>
      <td class="counter ${prevSuccess ? "success" : "pending"}">${prevCount}</td>
    `;

    tr.querySelectorAll(".checkbox").forEach((box, i) => {
      box.onclick = () => {
        checks[i] = !checks[i];
        saveDB(db);
        render();
      };
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  app.appendChild(table);
}

function renderEditMode(db, app) {
  db.habits.forEach((habit, index) => {
    const row = document.createElement("div");
    row.className = "edit-row";

    row.innerHTML = `
      <span>${habit.name}</span>
      <input type="number" min="1" value="${habit.target}" />
      <button>↑</button>
      <button>↓</button>
      <button>🗑</button>
    `;

    const [input, up, down, del] = row.querySelectorAll("input, button");

    input.onchange = () => {
      habit.target = +input.value;
      saveDB(db);
      render();
    };

    up.onclick = () => {
      if (index === 0) return;
      [db.habits[index - 1], db.habits[index]] =
      [db.habits[index], db.habits[index - 1]];
      saveDB(db);
      render();
    };

    down.onclick = () => {
      if (index === db.habits.length - 1) return;
      [db.habits[index + 1], db.habits[index]] =
      [db.habits[index], db.habits[index + 1]];
      saveDB(db);
      render();
    };

    del.onclick = () => {
      if (!confirm("Delete habit? Past data will be kept.")) return;
      db.habits = db.habits.filter(h => h.id !== habit.id);
      saveDB(db);
      render();
    };

    app.appendChild(row);
  });

  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Add habit";
  addBtn.className = "add-btn";
  addBtn.onclick = () => {
    db.habits.push({
      id: "h" + Date.now(),
      name: "New habit",
      target: 1
    });
    saveDB(db);
    render();
  };

  app.appendChild(addBtn);
}

/* ------------------ TOGGLE ------------------ */

document.getElementById("editToggle").onclick = () => {
  editMode = !editMode;
  render();
};

/* ------------------ INIT ------------------ */

render();
