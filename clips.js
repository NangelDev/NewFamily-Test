let clientId = "";
let accessToken = "";
let clipsQueue = [];
let clipHistory = []; // Historique pour "précédent"

// Mets ton domaine Netlify exact ici (ou celui du site original)
const PARENT_DOMAIN = "newfamily-test.netlify.app";

const members = [
  "Nexou31",
  "Clarastonewall",
  "Red_shadow_31",
  "Selena_Akemi",
  "Thony1384",
  "Jenny31200",
  "Vektor_live",
  "Livio_on",
  "Dylow95",
];

// === Récupération du token + client_id depuis Netlify Function ===
async function getToken() {
  const res = await fetch("/.netlify/functions/getTwitchData");
  if (!res.ok) {
    console.error(`getTwitchData failed: ${res.status}`);
    return;
  }
  const data = await res.json();
  accessToken = data.access_token;
  clientId = data.client_id;

  if (!accessToken || !clientId) {
    console.error("Token ou client_id manquant");
  }
}

// === Récupération de l'ID utilisateur ===
async function getUserId(username) {
  const res = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`,
    {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    console.error(`getUserId(${username}) -> ${res.status}`);
    return null;
  }

  const data = await res.json();
  return data.data?.[0]?.id || null;
}

// === Récupération d'un clip aléatoire ===
async function getRandomClip(userId) {
  const res = await fetch(
    `https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=10`,
    {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    console.error(`getRandomClip(${userId}) -> ${res.status}`);
    return null;
  }

  const data = await res.json();
  const validClips = (data.data || []).filter(
    (clip) => clip.thumbnail_url && clip.id
  );
  if (validClips.length === 0) return null;

  return validClips[Math.floor(Math.random() * validClips.length)];
}

// === Préparation de la liste de clips ===
async function prepareClips() {
  for (const member of members) {
    const userId = await getUserId(member);
    if (!userId) continue;
    const clip = await getRandomClip(userId);
    if (clip) {
      clipsQueue.push({
        id: clip.id,
        user: member,
      });
    }
  }
}

// === Affichage d'un clip spécifique ===
function displayClip(id, user) {
  const iframeSrc = `https://clips.twitch.tv/embed?clip=${id}&parent=${PARENT_DOMAIN}`;
  document.getElementById("clip-player").src = iframeSrc;
  document.getElementById("clip-user").textContent = `👤 ${user}`;
}

// === Affichage du prochain clip ===
function displayNextClip() {
  if (clipsQueue.length === 0) {
    document.getElementById("clip-player").src = "";
    document.getElementById("clip-user").textContent =
      "Aucun autre clip disponible.";
    return;
  }

  const { id, user } = clipsQueue.shift();
  if (document.getElementById("clip-player").src) {
    // Ajoute à l'historique si ce n'est pas le premier affichage
    clipHistory.push({ id, user });
  }
  displayClip(id, user);
}

// === Affichage du clip précédent ===
function displayPreviousClip() {
  if (clipHistory.length < 2) {
    // Moins de 2 = soit aucun clip avant, soit juste le premier affiché
    return;
  }
  // Retire le clip actuel et prend le précédent
  clipHistory.pop();
  const { id, user } = clipHistory[clipHistory.length - 1];
  displayClip(id, user);
}

// === Écoutes des boutons ===
document.addEventListener("DOMContentLoaded", () => {
  const nextBtn = document.getElementById("next-button");
  if (nextBtn) nextBtn.addEventListener("click", displayNextClip);

  const prevBtn = document.getElementById("prev-button");
  if (prevBtn) prevBtn.addEventListener("click", displayPreviousClip);
});

// === Initialisation ===
(async () => {
  await getToken();
  if (!accessToken || !clientId) {
    document.getElementById("clip-user").textContent =
      "Erreur d’authentification Twitch. Réessaie plus tard.";
    return;
  }
  await prepareClips();
  displayNextClip();
})();
