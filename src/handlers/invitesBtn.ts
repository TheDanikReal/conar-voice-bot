import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import { checkChannelOwner } from '../preconditions/manageVoice.js';
import { database } from '../base.js';
import { createGenericEmbed } from '../utils/embeds.js';

export class inviteButtonHandler extends InteractionHandler {
    public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
        super(ctx, {
            ...options,
            interactionHandlerType: InteractionHandlerTypes.Button,
        });
    }

    public override parse(interaction: ButtonInteraction) {
        if (interaction.customId !== 'manageRequests') return this.none();
        //todo: preconditions
        /* const precondition = this.container.stores.get("preconditions").get("ManageVoice")
        if (precondition) {
          if ((await precondition.chatInputRun(interaction)).isErr()) return this.none()
        }*/

        return this.some();
    }

    public async run(interaction: ButtonInteraction) {
        if (interaction.channel?.type != ChannelType.GuildVoice) return
        const isOwner = await checkChannelOwner(interaction)
        const channelId = interaction.channel.id
        if (isOwner) {
            const result = await database.toggleInvites(channelId)
            interaction.reply(result ? "enabled" : "disabled")
            return
        }
        if (await database.areInvitesEnabled(channelId)) {
            const channel = await database.findChannel(channelId)
            const mentionInteractor = `<@${interaction.user.id}>`
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm')
                        .setLabel('Принять')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancel')
                        .setLabel('Отклонить')
                        .setStyle(ButtonStyle.Danger)
                );
            const response = await interaction.reply({
                content: `<@${channel?.ownerId}>`,
                embeds: [createGenericEmbed(interaction.user, `${mentionInteractor} отправил запрос на вход в этот канал.`)],
                components: [row],
                withResponse: true
            })
            try {
                const result = await response.awaitMessageComponent({
                    filter: (i) => {
                        console.log("got " + i.user.id + "expect" + channel?.ownerId)
                        return i.user.id == channel?.ownerId
                    },
                    time: 60 * 1000
                })
                if (result.customId === 'confirm') {
                    await result.update({ content: 'Действие подтверждено! 🎉', components: [] });
                } else if (result.customId === 'cancel') {
                    await result.update({ content: 'Действие отменено. ❌', components: [] });
                }
            } catch (err) {}
        }
    }
}