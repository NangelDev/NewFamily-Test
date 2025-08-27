// --- script.js (version complète, cards stylées en Tailwind) ---

let clientId = "";
let token = "";

// Récupère access_token + client_id depuis la Netlify Function
async function getToken() {
  const response = await fetch("/.netlify/functions/getTwitchData");
  const data = await response.json();
  token = data.access_token;
  clientId = data.client_id; // évite de hardcoder, suit l'env
}

// Charge les 2 listes d'utilisateurs
async function fetchUserLists() {
  const [res1, res2] = await Promise.all([
    fetch("users1.json"),
    fetch("users2.json"),
  ]);
  const users1 = await res1.json();
  const users2 = await res2.json();
  return [...users1, ...users2];
}

// Streams pour un lot de logins (max 100)
async function fetchStreams(logins) {
  const query = logins.map((user) => `user_login=${user}`).join("&");
  const url = `https://api.twitch.tv/helix/streams?${query}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ fetchStreams a échoué avec le code ${response.status}`);
      return { data: [] };
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Erreur dans fetchStreams :", error);
    return { data: [] };
  }
}

// Infos de profil (en chunks de 100)
async function fetchUsersInfo(allUsers) {
  const results = [];
  const erreurs = [];

  for (let i = 0; i < allUsers.length; i += 100) {
    const chunk = allUsers.slice(i, i + 100);
    const query = chunk.map((user) => `login=${user}`).join("&");
    const url = `https://api.twitch.tv/helix/users?${query}`;

    try {
      const response = await fetch(url, {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Erreur pour : ${chunk.join(", ")}`);
      const data = await response.json();
      results.push(...data.data);
    } catch (error) {
      console.warn("❌ Utilisateurs ignorés :", chunk, "-", error.message);
      erreurs.push(...chunk);
    }
  }

  if (erreurs.length > 0) {
    console.log("⚠️ Logins invalides détectés :", erreurs);
  }

  return results;
}

// Liste VIP (simple JSON)
async function fetchVIPList() {
  const response = await fetch("vip.json");
  return await response.json();
}

// --- INIT PRINCIPALE ---
async function init() {
  await getToken();

  if (!token || !clientId) {
    console.error("❌ Token ou Client ID manquant !");
    return;
  }

  const allUsers = await fetchUserLists();
  const usersInfo = await fetchUsersInfo(allUsers);
  const vipList = await fetchVIPList();

  // On split en 2 appels streams (100 + reste)
  const streamChunks = [allUsers.slice(0, 100), allUsers.slice(100)];
  const onlineUsers = [];

  for (const group of streamChunks) {
    if (group.length === 0) continue;
    const data = await fetchStreams(group);
    onlineUsers.push(...data.data);
  }

  const liveContainer = document.getElementById("live-users");
  const offlineContainer = document.getElementById("offline-users");
  const onlineLogins = onlineUsers.map((u) => u.user_login.toLowerCase());

  // VIP en premier, sinon ordre inchangé
  const sortedUsers = [...allUsers].sort((a, b) => {
    const aIsVip = vipList.includes(a.toLowerCase());
    const bIsVip = vipList.includes(b.toLowerCase());
    return aIsVip === bIsVip ? 0 : aIsVip ? -1 : 1;
  });

  // Rendu des cartes (UNIQUEMENT la partie visuelle a été ajustée)
  for (const user of sortedUsers) {
    const isOnline = onlineLogins.includes(user.toLowerCase());
    const streamData = onlineUsers.find(
      (u) => u.user_login.toLowerCase() === user.toLowerCase()
    );
    const userInfo = usersInfo.find(
      (u) => u.login.toLowerCase() === user.toLowerCase()
    );

    const link = `https://twitch.tv/${user}`;
    const game = isOnline ? streamData.game_name : "";
    const title = isOnline
      ? `<strong>Venez soutenir</strong> ce membre de la <strong>New Family</strong> qui joue actuellement à <em>${game}</em>.`
      : "Hors ligne";

    const img = isOnline
      ? streamData.thumbnail_url
          .replace("{width}", "320")
          .replace("{height}", "180")
      : userInfo?.profile_image_url ||
        "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png";

    // Conteneur
    const card = document.createElement("div");

    // Classes Tailwind pour la carte (même gabarit et hover que l'original)
    const baseCardClasses =
      "block bg-white rounded-xl text-center shadow-md transition " +
      "hover:-translate-y-1 hover:bg-rosePale hover:shadow-violet/50 " +
      "p-4 w-[180px] m-2";

    // Hors-ligne = gris/atténué
    const offlineClasses = isOnline ? "" : " grayscale opacity-75";

    // Badge VIP si concerné
    const vipBadge = vipList.includes(user.toLowerCase())
      ? '<div class="text-[0.9em] font-bold text-or mb-1">⭐ VIP</div>'
      : "";

    // HTML interne de la card
    card.innerHTML = `
      <a href="${link}" target="_blank" class="${baseCardClasses}${offlineClasses}">
        ${vipBadge}
        <img src="${img}" alt="Preview" class="w-full h-[120px] object-cover rounded">
        <div class="font-bold text-[1.1em] text-rouge mt-2">${user}</div>
        <div class="text-[0.9em] text-gris444 mt-2 leading-6 text-center">${title}</div>
      </a>
    `;

    if (isOnline) {
      liveContainer.appendChild(card);
    } else {
      offlineContainer.appendChild(card);
    }
  }

  // Compteur “Actuellement en direct”
  const liveCountElement = document.getElementById("live-count");
  const emoji =
    onlineUsers.length === 0 ? "😴" : onlineUsers.length > 20 ? "🔥" : "✨";

  liveCountElement.textContent = `${emoji} ${onlineUsers.length} membre${
    onlineUsers.length > 1 ? "s" : ""
  } de la New Family ${
    onlineUsers.length > 1 ? "sont" : "est"
  } actuellement en live`;
}

// Go!
init();
