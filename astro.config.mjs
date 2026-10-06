// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Nunito Sans",
      cssVariable: "--nunito-sans",
      weights: [400, 500, 600],
      styles: ["normal", "italic"],
    },
  ],
});
