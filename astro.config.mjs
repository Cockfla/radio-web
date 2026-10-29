import { defineConfig, envField } from "astro/config";

import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://www.gentecomunicaciones.cl",
  integrations: [tailwind({ applyBaseStyles: false })],
  output: "server",
  adapter: cloudflare({
    // Las imágenes de public/ y las de noticias (remotas) se sirven tal cual;
    // sharp no corre en Workers.
    imageService: "passthrough",
  }),
  env: {
    schema: {
      NEWS_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      OPENWEATHER_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
});
