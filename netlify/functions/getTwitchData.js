const fetch = require("node-fetch");

const client_id = process.env.TWITCH_CLIENT_ID;
const client_secret = process.env.TWITCH_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiry = 0;

exports.handler = async function (event, context) {
  try {
    const now = Date.now();

    // Si le token a expiré ou n’existe pas encore
    if (!cachedToken || now >= tokenExpiry) {
      const tokenResponse = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials`,
        { method: "POST" }
      );
      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        throw new Error("Impossible d'obtenir un token Twitch");
      }

      cachedToken = tokenData.access_token;
      tokenExpiry = now + tokenData.expires_in * 1000;
    }

    // Retourne le token ET le client_id utilisé
    return {
      statusCode: 200,
      body: JSON.stringify({
        access_token: cachedToken,
        client_id: client_id,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
