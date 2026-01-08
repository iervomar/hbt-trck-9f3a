const habits = [
  { id: "med", name: "Meditation", target: 3 },
  { id: "read", name: "Reading", target: 5 },
  { id: "de", name: "German", target: 2 },
  { id: "uke", name: "Ukulele / Creative", target: 2 },
  { id: "proj", name: "Personal Project", target: 1 },
  { id: "tv", name: "TV (max)", target: 3 }
];

function getWeekNumber(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const currentWeek = getWeekNumber();
document.getElementById("week").textContent = currentWeek;

const STORAGE_KEY = "weekly-focus-db";

function loadDB() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

const db = loadDB();
const lastWeek = currentWeek - 1;
const container = document.getElementById("habits");

habits.forEach(habit => {
  const done = db[currentWeek]?.[habit.id] || 0;
  const doneLastWeek = db[lastWeek]?.[habit.id] || 0;

  const div = document.createElement("div");
  div.className = "habit";

  div.innerHTML = `
    <div class="name">
      ${habit.name}
      ${doneLastWeek > 0 ? '<span class="last-week">•</span>' : ''}
    </div>
    <div class="boxes">
      ${Array.from({ length: habit.target }).map((_, i) =>
        `<span class="${i < done ? 'done' : ''}" data-i="${i}"></span>`
      ).join("")}
    </div>
  `;

  div.querySelectorAll("span").forEach((box, i) => {
    box.onclick = () => {
      db[currentWeek] = db[currentWeek] || {};
      db[currentWeek][habit.id] = i + 1 === done ? i : i + 1;
      saveDB(db);
      location.reload();
    };
  });

  container.appendChild(div);
});
