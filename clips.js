const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let accessToken = "";
let clipsQueue = [];

const members = ["Nexou31", "Clarastonewall", "Red_shadow_31", "Selena_Akemi", "Thony1384", "Jenny31200", "Vektor_live", "Livio_on", "Dylow95"];

async function getToken() {
    const res = await fetch('/.netlify/functions/getTwitchData');
    const data = await res.json();
    accessToken = data.access_token;
}

async function getUserId(username) {
    const res = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
        headers: {
            "Client-ID": clientId,
            "Authorization": `Bearer ${accessToken}`
        }
    });
    const data = await res.json();
    return data.data[0]?.id;
}

async function getRandomClip(userId) {
    const res = await fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=10`, {
        headers: {
            "Client-ID": clientId,
            "Authorization": `Bearer ${accessToken}`
        }
    });
    const data = await res.json();

    console.log(`Clips reçus pour ${userId}:`, data.data); // 👈 ici

    const validClips = data.data.filter(clip => clip.thumbnail_url && clip.id);
    if (validClips.length === 0) return null;

    const chosenClip = validClips[Math.floor(Math.random() * validClips.length)];
    console.log(`➡️ Clip choisi:`, chosenClip); // 👈 ici aussi
    return chosenClip;
}


async function prepareClips() {
    for (const member of members) {
        const userId = await getUserId(member);
        if (!userId) continue;
        const clip = await getRandomClip(userId);
        if (clip) {
            clipsQueue.push({
                id: clip.id,
                user: member
            });
        }
    }
}

function displayNextClip() {
    if (clipsQueue.length === 0) {
        document.getElementById("clip-player").src = "";
        document.getElementById("clip-user").textContent = "Aucun autre clip disponible.";
        return;
    }

    const { id, user } = clipsQueue.shift();
    const iframeSrc = `https://clips.twitch.tv/embed?clip=${id}&parent=newfamily.netlify.app`;

    console.log(`🎬 Affichage du clip de ${user} →`, iframeSrc); // 👈 ici

    document.getElementById("clip-player").src = iframeSrc;
    document.getElementById("clip-user").textContent = `👤 ${user}`;
}


document.getElementById("next-button").addEventListener("click", displayNextClip);

(async () => {
    await getToken();
    await prepareClips();
    displayNextClip();
})();
