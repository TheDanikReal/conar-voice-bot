import { LabelBuilder, ModalBuilder } from '@discordjs/builders';
import { ButtonHandler, ButtonRoute, ModalHandler, ModalRoute } from '@seedcord/gateway';
import { ChannelType, TextInputStyle } from 'discord.js';

import { database } from '../utils/base';
import { composeDashboard } from '../utils/dashboard';
import { getMainMessage } from '../utils/embeds';
import { MemberLimitId, MemberLimitModalId } from '../utils/interactionIds';

@ButtonRoute(MemberLimitId)
export class MemberLimitButton extends ButtonHandler<[typeof MemberLimitId]> {
    public async execute(): Promise<void> {
        if (this.event.channel?.type !== ChannelType.GuildVoice) return;
        const modal = new ModalBuilder().setCustomId(MemberLimitModalId.encode({})).setTitle('Input member limit');
        const label = new LabelBuilder()
            .setLabel('Input number:')
            .setTextInputComponent((builder) =>
                builder
                    .setCustomId('limit')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(2)
                    .setRequired(true)
                    .setPlaceholder('1 - 99')
            );
        modal.addLabelComponents(label);
        await this.showModal(modal);
    }
}

@ModalRoute(MemberLimitModalId)
export class MemberLimitModal extends ModalHandler<[typeof MemberLimitModalId]> {
    public async execute(): Promise<void> {
        const channel = this.event.channel!;
        const limit = parseInt(this.event.fields.getTextInputValue('limit').trim(), 10);
        await this.reply(`Set limit ${limit} members. ✅`);
        if (!(this.event.channel && channel.type === ChannelType.GuildVoice && channel.isVoiceBased())) return;
        await channel.setUserLimit(limit);
        const settings = await database.findChannel(channel.id);
        const mainMessage = await getMainMessage(channel, settings);
        mainMessage.edit(
            composeDashboard({
                disableRequests: !settings?.requests,
                members: channel.members.size,
                owner: await this.event.guild.members.fetch(settings?.ownerId!)
            })
        );
    }
}
