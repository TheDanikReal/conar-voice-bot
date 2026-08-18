import { BuilderComponent, RegisterCommand } from "@seedcord/gateway"

@RegisterCommand("global")
export class Credits extends BuilderComponent<"command"> {
    constructor() {
        super("command")

        this.instance
            .setName("credits")
            .setDescription("Get list of bot developers and people who influenced development")
    }
}
