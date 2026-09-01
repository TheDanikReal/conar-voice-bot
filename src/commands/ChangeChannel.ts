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
            .addStringOption((builder) =>
                builder
                    .setName("language")
                    .setDescription("language to use for commands, dashboards in temp channels")
                    .setChoices([
                        {
                            name: "English",
                            value: "en"
                        },
                        {
                            name: "Беларуская мова (Belarusian)",
                            value: "be"
                        },
                        {
                            name: "Русский язык (Russian)",
                            value: "ru"
                        }
                    ])
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    }
}
