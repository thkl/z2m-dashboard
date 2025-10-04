/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'unifi-bg': '#0d1117',
        'unifi-panel': '#161b22',
        'unifi-accent': '#00c2ff',
      },
    },
  },
  plugins: [],
};
