import { BuilderComponent, RegisterCommand } from "@seedcord/gateway"

@RegisterCommand("global")
export class Cat extends BuilderComponent<"command"> {
    constructor() {
        super("command")

        this.instance.setName("cat").setDescription("Get a random cat from CatAAS")
    }
}
