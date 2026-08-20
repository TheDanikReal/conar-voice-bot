import { BuilderComponent, RegisterCommand } from "@seedcord/gateway"
import { PermissionFlagsBits } from "discord.js"

@RegisterCommand("global")
export class RemoveChannel extends BuilderComponent<"command"> {
    constructor() {
        super("command")

        this.instance
            .setName("removechannel")
            .setDescription("Remove active temporary channel from database and make it a regular channel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    }
}
