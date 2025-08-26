console.log("✅ clip.js chargé");

const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke"; // OK
let accessToken = "";
let clipsQueue = [];
let currentIndex = -1;

const PARENT_DOMAIN = "newfamily.netlify.app"; // OK

const members = [
  "nexou31",
  "clarastonewall",
  "red_shadow_31",
  "selena_akemi",
  "thony1384",
  "jenny31200",
  "vektor_live",
  "livio_on",
  "dylow95",
];

// --- Token via Netlify Function ---
async function getToken() {
  const res = await fetch("/.netlify/functions/getTwitchData");
  if (!res.ok) {
    console.error(`getTwitchData failed: ${res.status}`);
    return;
  }
  const data = await res.json();
  accessToken = data.access_token;
}

// --- User ID ---
async function getUserId(username) {
  const login = username.toLowerCase();
  const res = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,
    {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0]?.id || null;
}

// --- Clip aléatoire ---
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
  if (!res.ok) return null;
  const data = await res.json();
  const validClips = (data.data || []).filter(
    (clip) => clip.thumbnail_url && clip.id
  );
  if (validClips.length === 0) return null;

  const chosen = validClips[Math.floor(Math.random() * validClips.length)];
  // Remplace {width}/{height} pour l’aperçu
  const thumb = chosen.thumbnail_url
    .replace("{width}", "480")
    .replace("{height}", "272");

  return { id: chosen.id, thumbnail: thumb };
}

// --- Prépare la file de clips ---
async function prepareClips() {
  for (const member of members) {
    const userId = await getUserId(member);
    if (!userId) continue;
    const clip = await getRandomClip(userId);
    if (clip) {
      clipsQueue.push({ ...clip, user: member });
    }
  }
}

// --- Affiche la miniature ---
function displayClip(index) {
  const clip = clipsQueue[index];
  if (!clip) return;

  const clipPlayer = document.getElementById("clip-player");
  if (!clipPlayer) return;

  clipPlayer.innerHTML = `
    <img
      src="${clip.thumbnail}"
      alt="Preview du clip"
      loading="lazy"
      onclick="loadTwitchClip(this, '${clip.id}')"
      class="w-full rounded-lg cursor-pointer block"
    />
    <div class="absolute inset-0 flex items-center justify-center text-white text-5xl drop-shadow pointer-events-none">▶</div>
  `;

  const userEl = document.getElementById("clip-user");
  if (userEl) userEl.textContent = `👤 ${clip.user}`;
}

// --- Charge l'iframe Twitch ---
function loadTwitchClip(element, clipId) {
  const container = element.parentElement;
  if (!container) return;

  container.innerHTML = `
    <iframe
      src="https://clips.twitch.tv/embed?clip=${clipId}&parent=${PARENT_DOMAIN}"
      width="100%"
      height="405"
      frameborder="0"
      allowfullscreen
      loading="lazy"
    ></iframe>
  `;
}

// --- Navigation ---
function displayNextClip() {
  if (currentIndex < clipsQueue.length - 1) {
    currentIndex++;
    displayClip(currentIndex);
  } else {
    const userEl = document.getElementById("clip-user");
    if (userEl) userEl.textContent = "🚫 Aucun autre clip disponible.";
  }
}

function displayPreviousClip() {
  if (currentIndex > 0) {
    currentIndex--;
    displayClip(currentIndex);
  }
}

// --- DOM events ---
document.addEventListener("DOMContentLoaded", () => {
  const nextBtn = document.getElementById("next-button");
  if (nextBtn) nextBtn.addEventListener("click", displayNextClip);

  const prevBtn = document.getElementById("prev-button");
  if (prevBtn) prevBtn.addEventListener("click", displayPreviousClip);
});

// --- Init ---
(async () => {
  await getToken();
  if (!accessToken) {
    const userEl = document.getElementById("clip-user");
    if (userEl) userEl.textContent = "Erreur d’authentification Twitch.";
    return;
  }
  await prepareClips();

  if (clipsQueue.length === 0) {
    const player = document.getElementById("clip-player");
    const userEl = document.getElementById("clip-user");
    if (player) player.innerHTML = "";
    if (userEl) userEl.textContent = "Aucun clip trouvé pour le moment.";
    return;
  }

  displayNextClip();
})();
