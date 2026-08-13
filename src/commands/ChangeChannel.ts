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
                    .setRequired(true)
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    }
}
