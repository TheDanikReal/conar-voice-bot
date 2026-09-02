import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders"
import {
    SlashRoute,
    SlashHandler,
    ButtonHandler,
    Gated,
    RequirePermissions,
    RequireBotPermissions,
    ButtonRoute
} from "@seedcord/gateway"
import { ButtonStyle, ChannelType, MessageFlags, PermissionFlagsBits } from "discord.js"

import { database } from "../utils/base"
import { FailedStatusComponent, SuccessStatusComponent } from "../utils/embeds"
import { ForceSetupId } from "../utils/interactionIds"
import { getLocale } from "../utils/misc"

import type { Dict } from "../generated/i18n"
import type { MessageActionRowComponentBuilder } from "@discordjs/builders"
import type { Guild } from "discord.js"

@Gated(RequireBotPermissions([PermissionFlagsBits.ManageChannels]))
@SlashRoute("setup")
export class Setup extends SlashHandler<"setup"> {
    public async execute(): Promise<void> {
        const [t] = await Promise.all([getLocale({ serverId: this.event.guildId }), this.defer({ ephemeral: false })])

        const settings = await database.findServer(this.event.guildId)

        if (settings?.voiceChannel) {
            // todo: replace label with an icon
            const forceSetupBtn = new ButtonBuilder()
                .setLabel(t.setup.overwriteButtonLabel())
                .setStyle(ButtonStyle.Danger)
                .setCustomId(ForceSetupId.encode({}))
            const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([forceSetupBtn])
            await this.edit({
                components: [
                    new FailedStatusComponent(t.setup.channelAlreadyExists()).component.addActionRowComponents(
                        actionRow
                    )
                ]
            })
            return
        }

        const channelId = await autoSetup(this.event.guild, t)

        await this.edit({
            components: [new SuccessStatusComponent(t.setup.success({ channel: `<#${channelId}>` })).component]
        })
    }
}

@Gated(RequirePermissions([PermissionFlagsBits.ManageGuild]))
@ButtonRoute(ForceSetupId)
export class ForceSetupButton extends ButtonHandler<[typeof ForceSetupId]> {
    public async execute(): Promise<void> {
        const [t] = await Promise.all([getLocale({ serverId: this.event.guildId }), this.defer()])

        const channelId = await autoSetup(this.event.guild, t)

        await this.event.message.edit({
            flags: MessageFlags.IsComponentsV2,
            components: [new SuccessStatusComponent(t.setup.success({ channel: `<#${channelId}>` })).component]
        })

        await this.edit(t.setup.successButton())
    }
}

async function autoSetup(guild: Guild, t: Dict) {
    const category = await guild.channels.create({
        type: ChannelType.GuildCategory,
        name: t.setup.categoryName()
    })

    const channel = await guild.channels.create({
        type: ChannelType.GuildVoice,
        name: t.setup.creatorChannelName(),
        parent: category
    })

    await database.editServerIfExists({
        id: guild.id,
        voiceChannel: channel.id,
        voiceCategory: category.id,
        template: t.setup.template().replace("(", "{").replace(")", "}")
    })
    return channel.id
}
