let clientId = "";
let token = "";

async function getToken() {
  const response = await fetch("/.netlify/functions/getTwitchData");
  const data = await response.json();
  token = data.access_token;
  clientId = data.client_id;
}

async function fetchUserLists() {
  const [res1, res2] = await Promise.all([
    fetch("users1.json"),
    fetch("users2.json"),
  ]);
  const users1 = await res1.json();
  const users2 = await res2.json();
  return [...users1, ...users2];
}

async function fetchStreams(logins) {
  const query = logins.map((user) => `user_login=${user}`).join("&");
  const url = `https://api.twitch.tv/helix/streams?${query}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Client-ID": clientId,
        Authorization: "Bearer " + token,
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
          Authorization: "Bearer " + token,
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

async function fetchVIPList() {
  const response = await fetch("vip.json");
  return await response.json(); // liste des pseudos
}

async function init() {
  await getToken();

  const allUsers = await fetchUserLists();
  const usersInfo = await fetchUsersInfo(allUsers);
  const vipList = await fetchVIPList();

  const streamChunks = [allUsers.slice(0, 100), allUsers.slice(100)];
  const onlineUsers = [];

  for (const group of streamChunks) {
    const data = await fetchStreams(group);
    onlineUsers.push(...data.data);
  }

  const liveContainer = document.getElementById("live-users");
  const offlineContainer = document.getElementById("offline-users");
  const onlineLogins = onlineUsers.map((user) => user.user_login.toLowerCase());

  // Trier les utilisateurs : VIP d'abord
  const sortedUsers = [...allUsers].sort((a, b) => {
    const aIsVip = vipList.includes(a.toLowerCase());
    const bIsVip = vipList.includes(b.toLowerCase());
    return aIsVip === bIsVip ? 0 : aIsVip ? -1 : 1;
  });

  for (const user of sortedUsers) {
    const isOnline = onlineLogins.includes(user.toLowerCase());
    const streamData = onlineUsers.find(
      (u) => u.user_login.toLowerCase() === user.toLowerCase()
    );
    const userInfo = usersInfo.find(
      (u) => u.login.toLowerCase() === user.toLowerCase()
    );

    const card = document.createElement("div");
    card.classList.add("user-card");
    if (vipList.includes(user.toLowerCase())) {
      card.classList.add("vip");
    }
    if (!isOnline) card.classList.add("offline");

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

    card.innerHTML = `
            <a href="${link}" target="_blank">
                <img src="${img}" alt="Preview">
                <div class="username">${user}</div>
                <div class="title">${title}</div>
            </a>
        `;

    if (isOnline) {
      liveContainer.appendChild(card);
    } else {
      offlineContainer.appendChild(card);
    }
  }

  const liveCountElement = document.getElementById("live-count");
  const emoji =
    onlineUsers.length === 0 ? "😴" : onlineUsers.length > 20 ? "🔥" : "✨";

  liveCountElement.textContent = `${emoji} ${onlineUsers.length} membre${
    onlineUsers.length > 1 ? "s" : ""
  } de la New Family ${
    onlineUsers.length > 1 ? "sont" : "est"
  } actuellement en live`;
}

init();
