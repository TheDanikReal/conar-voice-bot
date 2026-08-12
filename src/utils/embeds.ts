import { EmbedBuilder } from '@discordjs/builders';

import type { TempChannelCreateInput } from '../generated/prisma/models';
import type { GuildTextBasedChannel, User } from 'discord.js';

const statuses = {
    success: 0x00_ff_00,
    fail: 0xff_00_00
} as const;

export function createStatusEmbed(user: User, description: string, status: 'success' | 'fail') {
    /* will port this to containers later
    return new ContainerBuilder()
        .setAccentColor(statuses[status])*/
    return new EmbedBuilder()
        .setAuthor({ name: user.globalName || 'unknown', iconURL: user.displayAvatarURL() })
        .setColor(statuses[status])
        .setDescription(description);
}

export function createGenericEmbed(user: User, description: string, color = 0xff_ff_ff) {
    return new EmbedBuilder()
        .setAuthor({ name: user.globalName || 'unknown', iconURL: user.displayAvatarURL() })
        .setColor(color)
        .setDescription(description);
}

export async function getMainMessage(channel: GuildTextBasedChannel, settings: Partial<TempChannelCreateInput> | null) {
    return await channel?.messages.fetch(settings?.messageId!);
}
