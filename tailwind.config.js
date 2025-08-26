/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Arial", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Fond / texte
        fond: "#f2f2f2",
        fond2: "#f5f5f5",
        texteIndigo: "#4b0082",
        gris444: "#444444",
        gris666: "#666666",

        // Header principal
        brandStart: "#ff5f6d",
        brandEnd: "#845ec2", // = violet
        violet: "#845ec2",
        rosePale: "#f9f2ff",

        // Boutons / éléments
        rouge: "#e74c3c", // boutons génériques + usernames
        rougeBtn: "#f44336", // certains CTA (Aventura)
        or: "#DAA520", // goldenrod (VIP)
        orHover: "#d4ac0d",

        // Interviews
        interview: "#ff7f50",
        interviewH: "#ff5722",

        // Aventura (titres/gradient)
        aventuraRed: "#c0392b",
        aventuraViolet: "#8e44ad",

        // Twitch (clips)
        twitch: "#9146ff",
        twitchH: "#772ce8",

        // de base
        noir: "#000000",
        blanc: "#ffffff",
      },
    },
  },
  corePlugins: { preflight: false }, // conserve le rendu actuel
  plugins: [],
};
