import { ButtonHandler, ButtonRoute, ModalHandler, ModalRoute } from "@seedcord/gateway";
import { ChannelType, LabelBuilder, ModalBuilder, TextInputStyle } from "discord.js";
import { MemberLimitId, MemberLimitModalId } from "../utils/interactionIds";

@ButtonRoute(MemberLimitId)
export class MemberLimitButton extends ButtonHandler<[typeof MemberLimitId]> {
    public async execute(): Promise<void> {
        if (this.event.channel?.type !== ChannelType.GuildVoice) return
        const modal = new ModalBuilder()
            .setCustomId(MemberLimitModalId.encode({}))
            .setTitle("Установить лимит участников")
        const label = new LabelBuilder()
            .setLabel("Введите число:")
            .setTextInputComponent((builder) => {
                return builder
                    .setCustomId("limit")
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(2)
                    .setRequired(true)
                    .setPlaceholder("1 - 99")
            })
        modal.addLabelComponents(label)
        await this.showModal(modal)
    }
}

@ModalRoute(MemberLimitModalId)
export class MemberLimitModal extends ModalHandler<[typeof MemberLimitModalId]> {
    public async execute(): Promise<void> {
        const limit = parseInt(this.event.fields.getTextInputValue("limit").trim(), 10)
        await this.reply(`Установлен лимит ${limit} участников. ✅`)
        if (this.event.channel && this.event.channel.type === ChannelType.GuildVoice) {
            await this.event.channel.setUserLimit(limit)
        }
    }
}