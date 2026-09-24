import { defineConfig } from "vite";

// relative base so the built asset paths work under GitHub Pages'
// project-page URL (username.github.io/birthday-wishes/) without any
// extra config
export default defineConfig({
  base: "./",
});
