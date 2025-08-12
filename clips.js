let clientId = "";
let accessToken = "";
let clipsQueue = [];

// Mets ton domaine Netlify exact ici
const PARENT_DOMAIN = "newfamily.netlify.app";

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

// === Affichage du prochain clip ===
function displayNextClip() {
  if (clipsQueue.length === 0) {
    document.getElementById("clip-player").src = "";
    document.getElementById("clip-user").textContent =
      "Aucun autre clip disponible.";
    return;
  }

  const { id, user } = clipsQueue.shift();
  const iframeSrc = `https://clips.twitch.tv/embed?clip=${id}&parent=${PARENT_DOMAIN}`;

  document.getElementById("clip-player").src = iframeSrc;
  document.getElementById("clip-user").textContent = `👤 ${user}`;
}

// === Écoute du bouton "Clip suivant" ===
document.addEventListener("DOMContentLoaded", () => {
  const nextBtn = document.getElementById("next-button");
  if (nextBtn) nextBtn.addEventListener("click", displayNextClip);
});

// === Initialisation ===
(async () => {
  await getToken();
  await prepareClips();
  displayNextClip();
})();
