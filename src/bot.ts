import { resolve } from "node:path"

import { Seedcord } from "@seedcord/gateway"
import { GatewayIntentBits } from "discord.js"
import { Envapter } from "envapt"

Envapter.baseDir = resolve(import.meta.dirname, "..")

export const seedcord = new Seedcord({
    bot: {
        clientOptions: {
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
        },
        interactions: {
            path: resolve(import.meta.dirname, "./handlers")
        },
        commands: {
            path: resolve(import.meta.dirname, "./commands")
        },
        events: {
            path: resolve(import.meta.dirname, "./events")
        },
        emojis: {
            edit: ["edit", "964544146444546088"],
            bitrate: ["bitrate", "964544146444546088"],
            voiceLimited: ["voiceLimited", "964544146444546088"],
            lock: ["lock", "964544146444546088"],
            unlock: ["unlock", "964544146444546088"],
            members: ["members", "964544146444546088"],
            setup: ["setup", "964544146444546088"],
            booster: ["booster", "964544146444546088"],
            play: ["play", "964544146444546088"],
            delete: ["delete", "964544146444546088"],
            kick: ["kick", "964544146444546088"],
            mod: ["mod", "964544146444546088"]
        }
    },
    subscribers: {
        path: null
    },
    botColor: "Blurple",
    notifications: {
        developerUsername: "TheDanikReal"
    }
})

export default seedcord
