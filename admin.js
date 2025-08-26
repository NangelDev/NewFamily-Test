// admin.js

// 🔧 Remplace par l'URL réelle (ou un chemin local comme "./users1.json")
const JSON_URL = "https://URL.DE.TON.JSON/users1.json";

let users = [];

// --- Chargement de la liste ---
async function fetchUsers() {
  try {
    const res = await fetch(JSON_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    users = await res.json();
  } catch (err) {
    console.warn(
      "⚠️ Impossible de charger la liste depuis JSON_URL :",
      err.message
    );
    users = []; // fallback
  }
  displayUsers();
}

// --- Rendu de la liste ---
function displayUsers() {
  const list = document.getElementById("userList");
  list.innerHTML = "";

  users.forEach((user, index) => {
    const li = document.createElement("li");
    li.className =
      "flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm";

    li.innerHTML = `
      <span class="font-medium text-gris444">${escapeHtml(user)}</span>
      <button
        class="px-3 py-1 bg-rouge text-white rounded-md font-bold shadow hover:bg-violet hover:scale-105 transition"
        onclick="removeUser(${index})"
        aria-label="Supprimer ${escapeHtml(user)}"
        title="Supprimer"
      >❌</button>
    `;

    list.appendChild(li);
  });
}

// --- Ajout d'un user ---
function addUser() {
  const input = document.getElementById("user");
  const newUser = (input.value || "").trim().toLowerCase();

  if (!newUser) return;

  if (users.includes(newUser)) {
    alert("Ce membre est déjà dans la liste.");
    return;
  }

  users.push(newUser);
  input.value = "";
  displayUsers();

  // 💾 À faire plus tard : sauvegarder sur un backend sécurisé (Netlify Function / DB)
}

// --- Suppression d'un user ---
function removeUser(index) {
  users.splice(index, 1);
  displayUsers();

  // 💾 À faire plus tard : sauvegarder sur un backend sécurisé (Netlify Function / DB)
}

// --- Utilitaire pour éviter l'injection HTML ---
function escapeHtml(str) {
  return str.replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[m])
  );
}

// --- Ajout avec la touche Enter ---
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("user");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addUser();
    });
  }
});

// Go !
fetchUsers();
