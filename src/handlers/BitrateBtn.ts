import { LabelBuilder, ModalBuilder } from "@discordjs/builders"
import { ButtonHandler, ButtonRoute, Gated, ModalHandler, ModalRoute } from "@seedcord/gateway"
import { ChannelType, TextInputStyle } from "discord.js"

import { BitrateId, BitrateModalId } from "../utils/interactionIds"
import { getMaxBitrate } from "../utils/misc"
import { CheckRights } from "../utils/preconditions"
import { FailedStatusComponent, SuccessStatusComponent } from "../utils/embeds"

@Gated(CheckRights())
@ButtonRoute(BitrateId)
export class BitrateButton extends ButtonHandler<[typeof BitrateId]> {
    public async execute(): Promise<void> {
        const premiumTier = this.event.guild.premiumTier
        const modal = new ModalBuilder().setCustomId(BitrateModalId.encode({})).setTitle("Set bitrate")
        const label = new LabelBuilder().setLabel("Input number (kbps):").setTextInputComponent((builder) =>
            builder
                .setCustomId("bitrate")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(3)
                .setRequired(true)
                .setPlaceholder(`8 - ${getMaxBitrate(premiumTier)}`)
        )
        modal.addLabelComponents(label)
        await this.showModal(modal)
    }
}

@ModalRoute(BitrateModalId)
export class BitrateModal extends ModalHandler<[typeof BitrateModalId]> {
    public async execute(): Promise<void> {
        if (this.event.channel?.type !== ChannelType.GuildVoice) return
        await this.defer()
        const bitrate = parseInt(this.event.fields.getTextInputValue("bitrate").trim(), 10)
        if (Number.isNaN(bitrate)) {
            await this.edit({ components: [new FailedStatusComponent(`:warning: Entered bitrate is not a number`).component]})
            return
        }
        const maxBitrate = getMaxBitrate(this.event.guild.premiumTier)
        if (bitrate < 8 || bitrate > maxBitrate) {
            await this.edit({ components: [new FailedStatusComponent(`:warning: Selected bitrate exceeds limits! ${bitrate}`).component]})
            return
        }
        await this.event.channel.setBitrate(bitrate * 1000)
        await this.edit({ components: [new SuccessStatusComponent(`Successfully set ${bitrate} kbps bitrate. ✅`).component]})
    }
}
