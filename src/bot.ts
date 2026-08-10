import { resolve } from 'node:path';

import { Seedcord } from '@seedcord/gateway';
import { GatewayIntentBits } from 'discord.js';
import { Envapter } from 'envapt';

Envapter.baseDir = resolve(import.meta.dirname, '..');

export const seedcord = new Seedcord({
    bot: {
        clientOptions: {
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
        },
        interactions: {
            path: resolve(import.meta.dirname, './handlers')
        },
        commands: {
            path: resolve(import.meta.dirname, './commands')
        },
        events: {
            path: resolve(import.meta.dirname, './events')
        }
    },
    subscribers: {
        path: null
    },
    botColor: 'Blurple',
    notifications: {
        developerUsername: 'TheDanikReal'
    }
});

export default seedcord;
