async function fetchVIPList() {
    const response = await fetch('vip.json');
    return await response.json();
}

async function fetchUsersInfo(logins) {
    const query = logins.map(user => `login=${user}`).join('&');
    const url = `https://api.twitch.tv/helix/users?${query}`;

    const response = await fetch('/.netlify/functions/getTwitchData');
    const data = await response.json();
    const token = data.access_token;

    const res = await fetch(url, {
        headers: {
            'Client-ID': 'rr75kdousbzbp8qfjy0xtppwpljuke',
            'Authorization': 'Bearer ' + token
        }
    });
    const json = await res.json();
    return json.data;
}

async function showVIPs() {
    const vipList = await fetchVIPList();
    const usersInfo = await fetchUsersInfo(vipList);

    const container = document.getElementById('vip-users');

    usersInfo.forEach(user => {
        const card = document.createElement('div');
        card.classList.add('user-card', 'vip');
        card.innerHTML = `
            <a href="https://twitch.tv/${user.login}" target="_blank">
                <img src="${user.profile_image_url}" alt="${user.display_name}">
                <div class="username">${user.display_name}</div>
                <div class="title">⭐ Membre VIP du mois</div>
            </a>
        `;
        container.appendChild(card);
    });
}

showVIPs();
