import { defineConfig } from "seedcord"

export default defineConfig({
    root: "./src",
    instance: "./bot.ts",
    build: {
        tsconfig: "./tsconfig.build.json",
        start: "./index.ts"
    },
    idleAnimation: false,
    hmr: {
        typecheck: false
    }
})
