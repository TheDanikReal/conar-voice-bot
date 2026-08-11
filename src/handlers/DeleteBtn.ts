import { ButtonHandler, ButtonRoute } from "@seedcord/gateway";
import { DeleteId } from "../utils/interactionIds";
import { database } from "../utils/base";

@ButtonRoute(DeleteId)
export class DeleteButton extends ButtonHandler<[typeof DeleteId]> {
    public async execute(): Promise<void> {
        if (this.event.user.id !== (await database.findChannel(this.event.channel?.id!))?.ownerId) return
        await this.reply("bye!")
        await this.event.channel?.delete("user requested delete")
    }
}