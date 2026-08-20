import { BuilderComponent, RegisterCommand } from "@seedcord/gateway"
import { PermissionFlagsBits } from "discord.js"

@RegisterCommand("global")
export class RemoveChannel extends BuilderComponent<"command"> {
    constructor() {
        super("command")

        this.instance
            .setName("removechannel")
            .setDescription("Disable temporary channel creation for this server")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    }
}
