import createConfig from "@seedcord/eslint-config"

export default createConfig({
    tsconfigRootDir: import.meta.dirname,
    registerDiscordjsPlugin: true,
    registerSeedcordPlugin: true,
    registerPrettierPlugin: false,
    userConfigs: [{
        rules: {
            "@typescript-eslint/restrict-template-expressions": "off"
        }
    }],
    generalIgnores: ["**/seedcord-gen.d.ts", "src/generated/**/*.ts"]
})
