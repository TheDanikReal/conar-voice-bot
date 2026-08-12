import { ButtonHandler, ButtonRoute } from '@seedcord/gateway';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';

import { database } from '../utils/base';
import { createGenericEmbed } from '../utils/embeds';
import { InvitesActionId, InvitesId } from '../utils/interactionIds';
import { checkChannelOwner } from '../utils/preconditions';

@ButtonRoute(InvitesId)
export class InvitesButton extends ButtonHandler<[typeof InvitesId]> {
    public async execute(): Promise<void> {
        if (this.event.channel?.type != ChannelType.GuildVoice) return;
        const isOwner = await checkChannelOwner(this.event);
        const channelId = this.event.channel.id;
        if (isOwner) {
            const result = await database.toggleInvites(channelId);
            this.event.reply(result ? 'enabled' : 'disabled');
            return;
        }
        if (await database.areInvitesEnabled(channelId)) {
            const channel = await database.findChannel(channelId);
            const mentionInteractor = `<@${this.event.user.id}>`;
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(InvitesActionId.encode({ choice: 'approve', userId: this.event.user.id }))
                    .setLabel('Принять')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(InvitesActionId.encode({ choice: 'deny', userId: this.event.user.id }))
                    .setLabel('Отклонить')
                    .setStyle(ButtonStyle.Danger)
            );
            await this.event.reply({
                content: `<@${channel?.ownerId}>`,
                embeds: [
                    createGenericEmbed(this.event.user, `${mentionInteractor} отправил запрос на вход в этот канал.`)
                ],
                components: [row],
                withResponse: true
            });
        }
    }
}

@ButtonRoute(InvitesActionId)
export class InvitesAction extends ButtonHandler<[typeof InvitesActionId]> {
    public async execute(): Promise<void> {
        const { userId, choice } = this.params;
        const settings = await database.findChannel(this.event.channelId);
        if (!settings) return;
        if (userId == settings.id) {
            this.event.reply('you are the owner!');
        } else {
            this.event.reply(`${userId} and ${choice}`);
        }
    }
}
