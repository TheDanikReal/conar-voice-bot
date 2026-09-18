import { Kazagumo } from "kazagumo"
import { Connectors } from "shoukaku"

import seedcord from "../bot"
import { getLocale } from "./misc"

import type { VoiceChannel } from "discord.js"
import type { NodeOption } from "shoukaku"
import "envapt/config"

export let kazagumo: Kazagumo | null = null

function initLavalink(): void {
    if (!(process.env.LAVALINK_PASS && process.env.LAVALINK_URL)) {
        return
    }

    const nodes: NodeOption[] = [
        {
            auth: process.env.LAVALINK_PASS,
            url: process.env.LAVALINK_URL,
            name: "node",
            secure: process.env.LAVALINK_SECURE?.toLowerCase() === "true"
        }
    ]
    kazagumo = new Kazagumo(
        {
            defaultSearchEngine: "youtube",
            send: (guildId, payload) => {
                const guild = seedcord.bot.client.guilds.cache.get(guildId)
                if (guild) guild.shard.send(payload)
            }
        },
        new Connectors.DiscordJS(seedcord.bot.client),
        nodes
    )

    if (!kazagumo) return

    kazagumo.shoukaku.on("disconnect", (name) => {
        const players = [...kazagumo!.shoukaku.players.values()].filter((p) => p.node.name === name)
        void players.map(async (player) => {
            kazagumo!.destroyPlayer(player.guildId)
            await player.destroy()
        })
    })

    kazagumo.on("playerEmpty", (player) => {
        void player.destroy()
    })

    kazagumo.on("playerStart", (player, track) => {
        if (!player.voiceId) return
        const channel = seedcord.bot.client.channels.cache.get(player.voiceId) as VoiceChannel
        if (!channel) return
        // no promises for listeners :(
        void getLocale({ serverId: channel.guildId })
            .then((t) => {
                void channel
                    .send({
                        content: t.music.nowPlaying({
                            title: track.title,
                            author: track.author ?? t.music.unknown(),
                            source: track.sourceName,
                            url: track.uri ?? t.music.unknown(),
                            length: track.length?.toString() ?? t.music.unknown()
                        }),
                        allowedMentions: { parse: [] }
                    })
                    .catch(() => {
                        /* TODO: will handle later, when i'll realise how to use seedcord's
                                logger externally */
                    })
            })
            .catch(() => {})
    })
}

initLavalink()
