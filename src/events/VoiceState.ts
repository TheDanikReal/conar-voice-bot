import { EventHandler, RegisterEvent } from '@seedcord/gateway';
import { ChannelType, Events } from 'discord.js';
import { database } from '../utils/base';
import { composeDashboard } from '../utils/dashboard';

@RegisterEvent([Events.VoiceStateUpdate, { frequency: "on" }])
export class Voice extends EventHandler<Events.VoiceStateUpdate> {
    public async execute(): Promise<void> {
        const oldState = this.event[0]
        const newState = this.event[1]

        const guild = newState.guild
        const settings = await database.findServer(guild.id)
        const member = newState.member
        const category = settings?.voiceCategory
        if (!settings || !member || !category) return
        if (settings.voiceChannel == newState.channelId) {
            const channel = await guild.channels.create({
                name: member.user.globalName + " channel",
                type: ChannelType.GuildVoice,
                parent: category,
                reason: "Conor voice channels"
            })
                      //todo make this spaghetti code better, probably nove settings to database, make a store for saving and loading save slots so that users wont have to redo ig every time            })
            const message = await channel.send(composeDashboard({
                closed: false,
                disableRequests: false,
                owner: member.displayName,
                ownerAvatar: member.displayAvatarURL(),
                ownerId: member.id
            }))
            await member.voice.setChannel(channel, "Conor voice channels")
            await database.addChannel(channel.id, {
                messageId: message.id,
                ownerId: member.id!
            })
        }
        const oldId = oldState.channelId
        if (oldId && await database.findChannel(oldId)) {
            const channel = oldState.channel
            if (!channel || channel.members.size != 0) return
            try {
                await database.deleteChannel(oldId)
            } catch (err) {
                console.log("channel doesnt exist")
            }
            await channel.delete("nobody is in channel")
        }
    }
}
