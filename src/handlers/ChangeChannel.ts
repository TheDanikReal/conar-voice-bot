import { SlashHandler, SlashRoute } from '@seedcord/gateway';
import { MessageFlags, TextDisplayBuilder } from 'discord.js';
import { database } from "../utils/base"

const changingChannelDisplay = new TextDisplayBuilder({
    content: "changing channel"
})

const notAvailableDisplay = new TextDisplayBuilder({
    content: "not available in dms"
})

const successDisplay = new TextDisplayBuilder({
    content: "success"
})

@SlashRoute('setchannel')
export class ChangeChannel extends SlashHandler<'setchannel'> {
    public async execute(): Promise<void> {
        

        const msg = await this.event.reply({
            components: [changingChannelDisplay],
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
        });

    if (!this.event.guildId) { this.event.editReply({ components: [notAvailableDisplay] }); return }
    if (msg) {
        await database.editServerIfExists(this.event.guildId!,
            this.options.getChannel("channel").id,
            this.options.getChannel("category").id)
            this.event.editReply({ components: [successDisplay] });
        return
    }
    }
}
