// vip.js - version 100% Tailwind
const CLIENT_ID = "rr75kdousbzbp8qfjy0xtppwpljuke";
const NETLIFY_FN = "/.netlify/functions/getTwitchData";

async function fetchVIPList() {
  try {
    const res = await fetch("vip.json", { cache: "no-store" });
    if (!res.ok) throw new Error("vip.json introuvable");
    const list = await res.json();
    return (list || []).map((u) => String(u).trim()).filter(Boolean);
  } catch (e) {
    console.error("❌ fetchVIPList:", e);
    return [];
  }
}

async function getAccessToken() {
  const res = await fetch(NETLIFY_FN, { cache: "no-store" });
  if (!res.ok) throw new Error("Netlify function KO");
  const data = await res.json();
  if (!data?.access_token) throw new Error("Pas de token");
  return data.access_token;
}

async function fetchUsersInfo(logins, token) {
  if (!logins.length) return [];
  const query = logins.map((u) => `login=${encodeURIComponent(u)}`).join("&");
  const url = `https://api.twitch.tv/helix/users?${query}`;
  const res = await fetch(url, {
    headers: {
      "Client-ID": CLIENT_ID,
      Authorization: "Bearer " + token,
    },
  });
  if (!res.ok) {
    console.warn("⚠️ fetchUsersInfo status:", res.status);
    return [];
  }
  const json = await res.json();
  return json?.data || [];
}

function renderVipCard(container, user) {
  const login = user?.login || "unknown";
  const display = user?.display_name || login;
  const img =
    user?.profile_image_url ||
    "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png";

  const card = document.createElement("div");
  card.className =
    "w-[180px] p-4 m-2 bg-white rounded-xl text-center shadow-md transition " +
    "hover:-translate-y-1 hover:bg-rosePale hover:shadow-violet/50";

  card.innerHTML = `
    <div class="text-[0.9em] font-bold text-or mb-1">⭐ VIP</div>
    <a href="https://twitch.tv/${login}" target="_blank" rel="noopener">
      <img src="${img}" alt="${display}" 
           class="w-full h-[120px] object-cover rounded-md">
      <div class="font-bold text-[1.1em] text-rouge mt-2">${display}</div>
      <div class="text-[0.9em] text-gris444 mt-2 leading-6 text-center">
        ⭐ Membre VIP du mois
      </div>
    </a>
  `;
  container.appendChild(card);
}

async function showVIPs() {
  const container = document.getElementById("vip-users");
  if (!container) return;

  try {
    const vipList = await fetchVIPList();
    if (vipList.length === 0) {
      container.innerHTML = `<p class="text-center text-gris444">Aucun VIP configuré pour le moment.</p>`;
      return;
    }

    const token = await getAccessToken();
    const usersInfo = await fetchUsersInfo(
      vipList.map((u) => u.toLowerCase()),
      token
    );

    const infoByLogin = new Map(
      usersInfo.map((u) => [u.login.toLowerCase(), u])
    );

    container.innerHTML = ""; // reset
    vipList.forEach((name) => {
      const user = infoByLogin.get(name.toLowerCase()) || { login: name };
      renderVipCard(container, user);
    });
  } catch (e) {
    console.error("❌ showVIPs:", e);
    container.innerHTML = `<p class="text-center text-red-600">Erreur de chargement des VIP.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", showVIPs);
