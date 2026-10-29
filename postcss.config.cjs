// Tailwind 3 vía PostCSS (antes lo inyectaba @astrojs/tailwind, que no es
// compatible con Astro 6+).
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
