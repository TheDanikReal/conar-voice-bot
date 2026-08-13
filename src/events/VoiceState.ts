import { EventHandler, RegisterEvent } from "@seedcord/gateway"
import { ChannelType, Events } from "discord.js"

import { database } from "../utils/base"
import { composeDashboard } from "../utils/dashboard"

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
        if (settings.voiceChannel === newState.channelId) {
            const channel = await guild.channels.create({
                name: `${member.user.globalName} channel`,
                type: ChannelType.GuildVoice,
                parent: category,
                reason: "Conor voice channels"
            })
            //todo make this spaghetti code better, probably nove settings to database, make a store for saving and loading save slots so that users wont have to redo ig every time            })
            const message = await channel.send(
                composeDashboard({
                    members: 99,
                    disableRequests: false,
                    owner: member
                })
            )
            await member.voice.setChannel(channel, "Conor voice channels")
            await database.addChannel(channel.id, {
                messageId: message.id,
                ownerId: member.id
            })
        }
        const oldId = oldState.channelId
        if (oldId && (await database.findChannel(oldId))?.id) {
            const channel = oldState.channel
            if (!channel || channel.members.size > 0) return
            await channel.delete("nobody is in channel")
            try {
                await database.deleteChannel(oldId)
            } catch {
                console.log("channel doesnt exist")
            }
        }
    }
}
