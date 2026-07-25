import { SapphireClient, container } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import "dotenv/config"

import { ApplicationCommandRegistries, RegisterBehavior } from '@sapphire/framework';
import '@sapphire/plugin-logger/register';
import { ChangeChannel } from './commands/changechannel.js';
import { VoiceJoinListener } from './listeners/voicejoin.js';
import { ManageVoicePrecondition } from './preconditions/manageVoice.js';
import { RenameButtonHandler } from './handlers/renameBtn.js';
import { BitrateButtonHandler } from './handlers/bitrateBtn.js';
import { MemberLimitButtonHandler } from './handlers/memberLimitBtn.js';
import { inviteButtonHandler } from './handlers/invitesBtn.js';


process.env.NODE_ENV ??= 'development';

//todo: move this to a separate file
container.stores.loadPiece({
    piece: ChangeChannel,
    name: "changechannel",
    store: "commands"
})

container.stores.loadPiece({
    piece: VoiceJoinListener,
    name: "voicejoin",
    store: "listeners"
})

container.stores.loadPiece({
    piece: ManageVoicePrecondition,
    name: "ManageVoice",
    store: "preconditions"
})

container.stores.loadPiece({
    piece: RenameButtonHandler,
    name: "rename",
    store: "interaction-handlers"
})

container.stores.loadPiece({
    piece: BitrateButtonHandler,
    name: "bitrate",
    store: "interaction-handlers"
})

container.stores.loadPiece({
    piece: MemberLimitButtonHandler,
    name: "memberLimit",
    store: "interaction-handlers"
})

container.stores.loadPiece({
    piece: inviteButtonHandler,
    name: "invite",
    store: "interaction-handlers"
})
// end handlers

const client = new SapphireClient({
    intents: [GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates],
    baseUserDirectory: null
});

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);


client.login(process.env.DISCORD_TOKEN);