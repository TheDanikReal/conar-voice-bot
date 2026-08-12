import { LabelBuilder, ModalBuilder } from '@discordjs/builders';
import { ButtonHandler, ButtonRoute, ModalHandler, ModalRoute } from '@seedcord/gateway';
import { ChannelType, TextInputStyle } from 'discord.js';

import { BitrateId, BitrateModalId } from '../utils/interactionIds';
import { getMaxBitrate } from '../utils/misc';

@ButtonRoute(BitrateId)
export class BitrateButton extends ButtonHandler<[typeof BitrateId]> {
    public async execute(): Promise<void> {
        const premiumTier = this.event.guild.premiumTier;
        const modal = new ModalBuilder().setCustomId(BitrateModalId.encode({})).setTitle('Set bitrate');
        const label = new LabelBuilder().setLabel('Input number (kbps):').setTextInputComponent((builder) =>
            builder
                .setCustomId('bitrate')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(3)
                .setRequired(true)
                .setPlaceholder(`8 - ${getMaxBitrate(premiumTier)}`)
        );
        modal.addLabelComponents(label);
        await this.showModal(modal);
    }
}

@ModalRoute(BitrateModalId)
export class BitrateModal extends ModalHandler<[typeof BitrateModalId]> {
    public async execute(): Promise<void> {
        if (this.event.channel?.type !== ChannelType.GuildVoice) return;
        const bitrate = parseInt(this.event.fields.getTextInputValue('bitrate').trim(), 10);
        const maxBitrate = getMaxBitrate(this.event.guild.premiumTier);
        if (bitrate < 8 || bitrate > maxBitrate) {
            await this.reply(`:warning: Введённый битрейт выходит за допустимые рамки! ${bitrate}`);
            return;
        }
        await this.reply(`Successfully set ${bitrate} kbps bitrate. ✅`);
        await this.event.channel.setBitrate(bitrate * 1000);
    }
}
