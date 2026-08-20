import { RegisterCommand, BuilderComponent } from "@seedcord/gateway"
import { ChannelType, PermissionFlagsBits } from "discord.js"

@RegisterCommand("global")
export class SetChannelCommand extends BuilderComponent<"command"> {
    constructor() {
        super("command")

        this.instance
            .setName("setchannel")
            .setDescription("set channel for voice creating")
            .addChannelOption((builder) =>
                builder
                    .setName("channel")
                    .setDescription("voice channel to use")
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(true)
            )
            .addChannelOption((builder) =>
                builder
                    .setName("category")
                    .setDescription("category for temp channels")
                    .addChannelTypes(ChannelType.GuildCategory)
            )
            .addStringOption((builder) =>
                builder
                    .setName("template")
                    .setDescription("template for default channel names, use {username} for fetching username")
                    .setMinLength(1)
                    // 32 is limit for usernames
                    .setMaxLength(100 - 32)
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    }
}
