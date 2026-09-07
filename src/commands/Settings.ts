import { BuilderComponent, RegisterCommand } from "@seedcord/gateway"
import { PermissionFlagsBits } from "discord.js"

@RegisterCommand("global")
export class Cat extends BuilderComponent<"command"> {
    constructor() {
        super("command")

        this.instance.setName("settings").setDescription("Interactive dashboard for editing settings")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    }
}
