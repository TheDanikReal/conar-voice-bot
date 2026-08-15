import { ModalBuilder, LabelBuilder } from "@discordjs/builders"
import { ButtonHandler, ButtonRoute, ModalHandler, ModalRoute, Gated } from "@seedcord/gateway"
import { ChannelType, TextInputStyle } from "discord.js"

import { createStatusEmbed } from "../utils/embeds"
import { RenameId, RenameModalId } from "../utils/interactionIds"
import { CheckRights } from "../utils/preconditions"

@Gated(CheckRights())
@ButtonRoute(RenameId)
export class RenameButton extends ButtonHandler<[typeof RenameId]> {
    public async execute(): Promise<void> {
        if (this.event.channel?.type !== ChannelType.GuildVoice) return
        const modal = new ModalBuilder().setCustomId(RenameModalId.encode({})).setTitle("Rename channel")
        const label = new LabelBuilder()
            .setLabel("Name:")
            .setTextInputComponent((builder) =>
                builder
                    .setCustomId("name")
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(true)
                    .setPlaceholder("Channel name")
            )
        modal.addLabelComponents(label)
        await this.showModal(modal)
    }
}

@ModalRoute(RenameModalId)
export class RenameModal extends ModalHandler<[typeof RenameModalId]> {
    public async execute(): Promise<void> {
        await this.defer()
        const name = this.event.fields.getTextInputValue("name")
        await this.event.channel?.setName(name)
        await this.event.reply({
            embeds: [createStatusEmbed(this.event.user, "Changed channel name", "success")]
        })
    }
}
