import { BuilderComponent, RegisterCommand } from "@seedcord/gateway"
import { PermissionFlagsBits } from "discord.js"

@RegisterCommand("global")
export class Setup extends BuilderComponent<"command"> {
    constructor() {
        super("command")

        this.instance
            .setName("setup")
            .setDescription("Automatic setup of temp voice channels")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    }
}
