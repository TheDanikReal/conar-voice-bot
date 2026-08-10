import { ButtonHandler, ButtonRoute, ModalHandler, ModalRoute } from "@seedcord/gateway";
import { RenameId, RenameModalId } from "../utils/interactionIds";
import { ChannelType, ModalBuilder, LabelBuilder, TextInputStyle } from "discord.js";
import { createStatusEmbed } from "../utils/embeds";

@ButtonRoute(RenameId)
export class RenameButton extends ButtonHandler<[typeof RenameId]> {
    public async execute(): Promise<void> {
        if (this.event.channel?.type != ChannelType.GuildVoice) return
        const modal = new ModalBuilder()
            .setCustomId(RenameModalId.encode({}))
            .setTitle("Переименовать канал")
        const label = new LabelBuilder()
            .setLabel("Название:")
            .setTextInputComponent((builder) => {
                return builder
                    .setCustomId("name")
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(true)
                    .setPlaceholder("Название канала")
            })
        modal.addLabelComponents(label)
        await this.showModal(modal)
    }
}

@ModalRoute(RenameModalId)
export class RenameModal extends ModalHandler<[typeof RenameModalId]> {
    public async execute(): Promise<void> {
        const name = this.event.fields.getTextInputValue("name")
        await this.event.reply({ embeds: [createStatusEmbed(this.event.user, "Имя канала успешно изменено", "success")]})
         await this.event.channel?.setName(name)
    }
}