import createConfig from "@seedcord/eslint-config"

export default createConfig({
    tsconfigRootDir: import.meta.dirname,
    registerDiscordjsPlugin: true,
    registerSeedcordPlugin: true,
    registerPrettierPlugin: false,
    generalIgnores: ["**/seedcord-gen.d.ts"]
})
