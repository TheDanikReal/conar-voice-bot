import { LabelBuilder, ModalBuilder } from "@discordjs/builders"
import { Gated, ButtonRoute, ButtonHandler, ModalHandler, ModalRoute } from "@seedcord/gateway"
import { TextInputStyle } from "discord.js"

import { composeMusicDashboard } from "../utils/dashboard"
import { FailedStatusComponent } from "../utils/embeds"
import { AddMusicId, DestroyMusicId, MusicId, MusicModalId, NextMusicId } from "../utils/interactionIds"
import { kazagumo } from "../utils/lavalink"
import { getLocale } from "../utils/misc"
import { CheckRights, MusicDisabled, MusicNotFound } from "../utils/preconditions"

@Gated(CheckRights)
@ButtonRoute(MusicId)
export class MusicButton extends ButtonHandler<[typeof MusicId]> {
    public async execute(): Promise<void> {
        if (!kazagumo) throw new MusicDisabled()
        // seedcord defaults to ephemeral, so need to defer here
        await this.defer({ ephemeral: false })
        const t = await getLocale({ serverId: this.event.guildId })
        await this.event.editReply({
            ...composeMusicDashboard({
                title: kazagumo.getPlayer(this.event.channelId)?.queue[0]?.title ?? t.music.notPlaying()
            })
        })
    }
}

@Gated(CheckRights)
@ButtonRoute(AddMusicId)
export class AddMusicButton extends ButtonHandler<[typeof AddMusicId]> {
    public async execute(): Promise<void> {
        const t = await getLocale({ serverId: this.event.guildId })
        const modal = new ModalBuilder().setCustomId(MusicModalId.encode({})).setTitle(t.music.addTitle())
        const label = new LabelBuilder()
            .setLabel(t.music.search())
            .setTextInputComponent((builder) =>
                builder
                    .setCustomId("title")
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(50)
                    .setRequired(true)
                    .setPlaceholder(t.music.exampleMusic())
            )
        modal.addLabelComponents(label)
        await this.showModal(modal)
    }
}

@ModalRoute(MusicModalId)
export class MusicModal extends ModalHandler<[typeof MusicModalId]> {
    public async execute(): Promise<void> {
        if (!kazagumo) throw new MusicDisabled()
        await this.defer()
        const t = await getLocale({ serverId: this.event.guildId })
        if (!this.event.channelId) return
        const query = this.event.fields.getTextInputValue("title")
        const player = await kazagumo.createPlayer({
            guildId: this.event.guildId,
            voiceId: this.event.channelId,
            mute: false
        })
        const res = await player.search(query)
        const track = res.tracks[0]
        if (!track) throw new MusicNotFound()
        player.queue.add(track)
        if (!player.playing) await player.play()
        await this.edit(
            t.music.nowPlaying({
                author: track.author ?? t.music.unknown(),
                source: track.sourceName,
                length: track.length?.toString() ?? t.music.unknown(),
                title: track.title,
                url: track.uri ?? t.music.unknown()
            })
        )
    }
}

@Gated(CheckRights)
@ButtonRoute(DestroyMusicId)
export class DestroyPlayer extends ButtonHandler<[typeof DestroyMusicId]> {
    public async execute(): Promise<void> {
        if (!kazagumo) throw new MusicDisabled()
        const t = await getLocale({ serverId: this.event.guildId })
        const player = kazagumo.getPlayer(this.event.guildId)
        if (!player) {
            await this.reply({ components: [new FailedStatusComponent(t.music.alreadyOff()).component] })
            return
        }
        await player.destroy()
        await this.reply(t.setup.successButton())
    }
}

@Gated(CheckRights)
@ButtonRoute(NextMusicId)
export class NextMusic extends ButtonHandler<[typeof NextMusicId]> {
    public async execute(): Promise<void> {
        if (!kazagumo) throw new MusicDisabled()
        const t = await getLocale({ serverId: this.event.guildId })
        const player = kazagumo.getPlayer(this.event.guildId)
        if (!player?.queue[0]) {
            await this.reply({ components: [new FailedStatusComponent(t.music.alreadyOff()).component] })
            return
        }
        player.queue.remove(0)
        await this.reply(t.setup.successButton())
    }
}
