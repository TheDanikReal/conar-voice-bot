import { LabelBuilder, ModalBuilder } from "@discordjs/builders"
import { ButtonHandler, ButtonRoute, Gated, ModalHandler, ModalRoute } from "@seedcord/gateway"
import { ChannelType, TextInputStyle } from "discord.js"

import { database } from "../utils/base"
import { FailedStatusComponent, SuccessStatusComponent } from "../utils/embeds"
import { MemberLimitId, MemberLimitModalId } from "../utils/interactionIds"
import { getLocale, rerenderDashboard } from "../utils/misc"
import { CheckRights, RaceConditionDetected } from "../utils/preconditions"

@Gated(CheckRights())
@ButtonRoute(MemberLimitId)
export class MemberLimitButton extends ButtonHandler<[typeof MemberLimitId]> {
    public async execute(): Promise<void> {
        if (this.event.channel?.type !== ChannelType.GuildVoice) return
        const t = await getLocale({ serverId: this.event.guildId })
        const modal = new ModalBuilder().setCustomId(MemberLimitModalId.encode({})).setTitle(t.memberLimit.input())
        const label = new LabelBuilder()
            .setLabel(t.inputNumber())
            .setTextInputComponent((builder) =>
                builder
                    .setCustomId("limit")
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(2)
                    .setRequired(true)
                    .setPlaceholder("0 - 99")
            )
        modal.addLabelComponents(label)
        await this.showModal(modal)
    }
}

@ModalRoute(MemberLimitModalId)
export class MemberLimitModal extends ModalHandler<[typeof MemberLimitModalId]> {
    public async execute(): Promise<void> {
        const channel = this.event.channel
        if (!(channel && channel.type === ChannelType.GuildVoice && channel.isVoiceBased())) return
        const [t] = await Promise.all([getLocale({ serverId: this.event.guildId }), this.defer()])
        const limit = parseInt(this.event.fields.getTextInputValue("limit").trim(), 10)
        if (limit < 0 || limit > 99 || Number.isNaN(limit)) {
            await this.edit({ components: [new FailedStatusComponent(t.memberLimit.incorrect()).component] })
            return
        }
        await channel.setUserLimit(limit)
        await database.changeMaxMembers(channel.id, limit)
        if ((await database.findChannel(channel.id))?.closed) {
            throw new RaceConditionDetected()
        }
        await rerenderDashboard(channel, this.event.guild)
        await this.edit({ components: [new SuccessStatusComponent(t.memberLimit.success({ count: limit })).component] })
    }
}
