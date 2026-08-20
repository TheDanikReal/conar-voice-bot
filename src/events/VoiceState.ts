import { EventHandler, RegisterEvent } from "@seedcord/gateway"
import { ChannelType, Events } from "discord.js"

import { database } from "../utils/base"
import { composeDashboard } from "../utils/dashboard"
import { isInvited, removeInvite } from "../utils/inviteStatus"
import { blacklistUsers } from "../utils/misc"

@RegisterEvent([Events.VoiceStateUpdate, { frequency: "on" }])
export class Voice extends EventHandler<Events.VoiceStateUpdate> {
    public async execute(): Promise<void> {
        const oldState = this.event[0]
        const newState = this.event[1]

        const guild = newState.guild
        const settings = await database.findServer(guild.id)
        const member = newState.member
        const category = settings?.voiceCategory
        if (!settings || !member) return
        const oldId = oldState.channelId
        const channel = oldId ? await database.findChannel(oldId) : undefined
        if (oldId && channel?.id) {
            const channel = oldState.channel
            if (channel?.members.size === 0) {
                await channel.delete("nobody is in channel")
                try {
                    await database.deleteChannel(oldId)
                } catch {
                    this.logger.info(`channel ${channel.id} doesnt exist`)
                }
            }
        }
        if (!settings.voiceChannel) return
        if (settings.voiceChannel === newState.channelId) {
            const invite = isInvited(member.id)
            if (invite) {
                await member.voice.setChannel(invite)
                removeInvite(member.id, invite)
                return
            }
            const slot = await database.findSave(member.id, 0)
            let disableRequests: boolean
            if (slot?.requestsEnabled !== undefined) {
                disableRequests = !slot.requestsEnabled
            } else disableRequests = false
            const templateName = settings.template
                ? settings.template.replace("{username}", member.user.username)
                : `${member.user.globalName}'s channel`
            const channel = await guild.channels.create({
                // todo: per server templates for channel name
                name: slot?.name ?? templateName,
                bitrate: slot?.bitrate ?? 64_000,
                userLimit: slot?.memberLimit ?? 0,
                type: ChannelType.GuildVoice,
                parent: category ?? null,
                reason: "Conor voice channels"
            })
            //todo make this spaghetti code better, probably nove settings to database, make a store for saving and loading save slots so that users wont have to redo ig every time            })
            const message = await channel.send(
                composeDashboard({
                    disableRequests,
                    owner: member,
                    closed: slot?.closed ?? false
                })
            )
            await blacklistUsers(channel, [], slot?.blacklist ?? [])
            await database.addChannel(channel.id, {
                messageId: message.id,
                ownerId: member.id,
                closed: slot?.closed ?? false,
                maxMembers: slot?.memberLimit ?? 0,
                requests: slot?.requestsEnabled ?? true,
                blacklist: slot?.blacklist ?? [],
                managers: slot?.managers ?? [],
                currentSlot: 0
            })
            await member.voice.setChannel(channel, "Conor voice channels")
        }
    }
}
