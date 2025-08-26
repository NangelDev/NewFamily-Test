const clientId = "kc7d05tymbi6m6i1au75p9iv9ngfmr";
let token = "";

async function getToken() {
  const response = await fetch("/.netlify/functions/getTwitchData");
  const data = await response.json();
  token = data.access_token;
}

async function fetchVIPList() {
  const response = await fetch("vip.json");
  return await response.json();
}

async function fetchUsersInfo(users) {
  const query = users.map((user) => `login=${user}`).join("&");
  const url = `https://api.twitch.tv/helix/users?${query}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("❌ Erreur fetchUsersInfo :", error);
    return [];
  }
}

async function initVIP() {
  await getToken();

  if (!token) {
    console.error("❌ Token manquant !");
    return;
  }

  const vipList = await fetchVIPList();
  const usersInfo = await fetchUsersInfo(vipList);

  const vipContainer = document.getElementById("vip-users");

  usersInfo.forEach((user) => {
    const card = document.createElement("div");
    card.className =
      "w-[180px] p-4 m-2 bg-white rounded-xl text-center shadow-md transition hover:-translate-y-1 hover:bg-rosePale hover:shadow-violet/50";

    const link = `https://twitch.tv/${user.login}`;
    const img =
      user.profile_image_url ||
      "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png";

    card.innerHTML = `
      <div class="text-[0.9em] font-bold text-or mb-1">⭐ VIP</div>
      <a href="${link}" target="_blank">
        <img src="${img}" alt="${user.display_name}" class="w-full h-[120px] object-cover rounded-md">
        <div class="username font-bold text-[1.1em] text-rouge mt-2">${user.display_name}</div>
        <div class="title text-[0.9em] text-gris444 mt-2 leading-6 text-center">⭐ Membre VIP du mois</div>
      </a>
    `;
    vipContainer.appendChild(card);
  });
}

initVIP();
