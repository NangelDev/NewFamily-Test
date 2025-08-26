// script.js — version 100% Tailwind
const CLIENT_ID = "rr75kdousbzbp8qfjy0xtppwpljuke";
const NETLIFY_FN = "/.netlify/functions/getTwitchData";

async function getToken() {
  const res = await fetch(NETLIFY_FN, { cache: "no-store" });
  if (!res.ok) throw new Error("Netlify function KO");
  const data = await res.json();
  if (!data?.access_token) throw new Error("Pas de token reçu");
  return data.access_token;
}

async function fetchUserLists() {
  const [r1, r2] = await Promise.all([
    fetch("users1.json", { cache: "no-store" }),
    fetch("users2.json", { cache: "no-store" }),
  ]);
  const u1 = r1.ok ? await r1.json() : [];
  const u2 = r2.ok ? await r2.json() : [];
  return [...u1, ...u2].map((u) => String(u).trim()).filter(Boolean);
}

async function fetchVIPList() {
  try {
    const res = await fetch("vip.json", { cache: "no-store" });
    if (!res.ok) return [];
    const list = await res.json();
    return (list || []).map((u) => String(u).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchUsersInfo(allUsers, token) {
  const results = [];
  for (let i = 0; i < allUsers.length; i += 100) {
    const chunk = allUsers.slice(i, i + 100);
    const query = chunk.map((u) => `login=${encodeURIComponent(u)}`).join("&");
    const url = `https://api.twitch.tv/helix/users?${query}`;
    try {
      const res = await fetch(url, {
        headers: { "Client-ID": CLIENT_ID, Authorization: "Bearer " + token },
      });
      if (!res.ok) continue;
      const json = await res.json();
      results.push(...(json?.data || []));
    } catch {}
  }
  return results;
}

async function fetchAllStreams(allUsers, token) {
  const all = [];
  for (let i = 0; i < allUsers.length; i += 100) {
    const chunk = allUsers.slice(i, i + 100);
    const query = chunk
      .map((u) => `user_login=${encodeURIComponent(u)}`)
      .join("&");
    const url = `https://api.twitch.tv/helix/streams?${query}`;
    try {
      const res = await fetch(url, {
        headers: { "Client-ID": CLIENT_ID, Authorization: "Bearer " + token },
      });
      if (!res.ok) continue;
      const json = await res.json();
      all.push(...(json?.data || []));
    } catch {}
  }
  return all;
}

function makeCardHTML({ login, display, img, title, isOnline, isVip }) {
  const base =
    "w-[180px] p-4 m-2 bg-white rounded-xl text-center shadow-md transition " +
    "hover:-translate-y-1 hover:bg-rosePale hover:shadow-violet/50";
  const offline = isOnline ? "" : " grayscale opacity-75";
  const vipBadge = isVip
    ? `<div class="text-[0.9em] font-bold text-or mb-1">⭐ VIP</div>`
    : "";

  return `
    <div class="${base}${offline}">
      ${vipBadge}
      <a href="https://twitch.tv/${login}" target="_blank" rel="noopener">
        <img src="${img}" alt="${display}" class="w-full h-[120px] object-cover rounded">
        <div class="font-bold text-[1.1em] text-rouge mt-2">${display}</div>
        <div class="text-[0.9em] text-gris444 mt-2 leading-6 text-center">${title}</div>
      </a>
    </div>
  `;
}

async function init() {
  const liveContainer = document.getElementById("live-users");
  const offlineContainer = document.getElementById("offline-users");
  const liveCountEl = document.getElementById("live-count");

  if (!liveContainer || !offlineContainer) return;

  try {
    const token = await getToken();
    const allUsers = await fetchUserLists(); // logins bruts
    const vipList = (await fetchVIPList()).map((v) => v.toLowerCase());

    // infos profil & streams
    const [usersInfo, streams] = await Promise.all([
      fetchUsersInfo(allUsers, token),
      fetchAllStreams(allUsers, token),
    ]);

    // index pour lookup rapide
    const infoByLogin = new Map(
      usersInfo.map((u) => [u.login.toLowerCase(), u])
    );
    const streamsByLogin = new Map(
      streams.map((s) => [s.user_login.toLowerCase(), s])
    );

    // tri : VIP en premier
    const sorted = [...allUsers].sort((a, b) => {
      const av = vipList.includes(a.toLowerCase());
      const bv = vipList.includes(b.toLowerCase());
      return av === bv ? 0 : av ? -1 : 1;
    });

    let onlineCount = 0;

    for (const loginRaw of sorted) {
      const login = loginRaw.toLowerCase();
      const info = infoByLogin.get(login);
      const stream = streamsByLogin.get(login);

      const display = info?.display_name || loginRaw;
      const isOnline = Boolean(stream);
      const isVip = vipList.includes(login);

      const img = isOnline
        ? stream.thumbnail_url
            .replace("{width}", "320")
            .replace("{height}", "180")
        : info?.profile_image_url ||
          "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png";

      const title = isOnline
        ? `<strong>Venez soutenir</strong> ce membre de la <strong>New Family</strong> qui joue actuellement à <em>${stream.game_name}</em>.`
        : "Hors ligne";

      const cardHTML = makeCardHTML({
        login,
        display,
        img,
        title,
        isOnline,
        isVip,
      });

      if (isOnline) {
        onlineCount++;
        liveContainer.insertAdjacentHTML("beforeend", cardHTML);
      } else {
        offlineContainer.insertAdjacentHTML("beforeend", cardHTML);
      }
    }

    // compteur
    const emoji = onlineCount === 0 ? "😴" : onlineCount > 20 ? "🔥" : "✨";
    if (liveCountEl) {
      liveCountEl.textContent = `${emoji} ${onlineCount} membre${
        onlineCount > 1 ? "s" : ""
      } de la New Family ${
        onlineCount > 1 ? "sont" : "est"
      } actuellement en live`;
    }
  } catch (e) {
    console.error("❌ init:", e);
    if (liveCountEl) {
      liveCountEl.textContent = "Erreur de chargement. Réessayez plus tard.";
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
