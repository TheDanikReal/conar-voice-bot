import { ButtonHandler, ButtonRoute, ModalHandler, ModalRoute } from "@seedcord/gateway";
import { ChannelType, LabelBuilder, ModalBuilder, TextInputStyle } from "discord.js";
import { BitrateId, BitrateModalId } from "../utils/interactionIds";

@ButtonRoute(BitrateId)
export class BitrateButton extends ButtonHandler<[typeof BitrateId]> {
    public async execute(): Promise<void> {
        if (this.event.channel?.type !== ChannelType.GuildVoice) return
        const modal = new ModalBuilder()
            .setCustomId(BitrateModalId.encode({}))
            .setTitle("Установить битрейт")
        const label = new LabelBuilder()
            .setLabel("Введите число:")
            .setTextInputComponent((builder) => {
                return builder
                    .setCustomId("bitrate")
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(3)
                    .setRequired(true)
                    .setPlaceholder("8 - 384")
            })
        modal.addLabelComponents(label)
        await this.showModal(modal)
    }
}

@ModalRoute(BitrateModalId)
export class BitrateModal extends ModalHandler<[typeof BitrateModalId]> {
    public async execute(): Promise<void> {
        const bitrate = parseInt(this.event.fields.getTextInputValue("bitrate").trim(), 10) * 1000
        if (bitrate < 8 || bitrate > 384) {
            await this.reply(":warning: Введённый битрейт выходит за допустимые рамки!")
            return
        }
        await this.reply(`Установлен битрейт ${bitrate} kbps. ✅`)
        if (this.event.channel && this.event.channel.type === ChannelType.GuildVoice) {
            await this.event.channel.setBitrate(bitrate)
        }
    }
}