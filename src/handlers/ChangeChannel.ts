import { TextDisplayBuilder } from '@discordjs/builders';
import { SlashHandler, SlashRoute } from '@seedcord/gateway';

import { database } from '../utils/base';

const changingChannelDisplay = new TextDisplayBuilder({
    content: 'changing channel'
});

const notAvailableDisplay = new TextDisplayBuilder({
    content: 'not available in dms'
});

const successDisplay = new TextDisplayBuilder({
    content: 'success'
});

@SlashRoute('setchannel')
export class ChangeChannel extends SlashHandler<'setchannel'> {
    public async execute(): Promise<void> {
        await this.reply({
            components: [changingChannelDisplay]
        });

        if (!this.event.guildId) {
            await this.event.editReply({ components: [notAvailableDisplay] });
            return;
        }
        await database.editServerIfExists({
            id: this.event.guildId,
            voiceChannel: this.options.getChannel('channel').id,
            voiceCategory: this.options.getChannel('category').id
        });
        await this.event.editReply({ components: [successDisplay] });
    }
}
