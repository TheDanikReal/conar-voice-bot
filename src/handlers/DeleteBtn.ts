import { ButtonHandler, ButtonRoute, Gated } from "@seedcord/gateway"

import { database } from "../utils/base"
import { DeleteId } from "../utils/interactionIds"
import { CheckRights } from "../utils/preconditions"
import { getLocale } from "../utils/misc"

@Gated(CheckRights())
@ButtonRoute(DeleteId)
export class DeleteButton extends ButtonHandler<[typeof DeleteId]> {
    public async execute(): Promise<void> {
        if (this.event.user.id !== (await database.findChannel(this.event.channel?.id!))?.ownerId) return
        const t = await getLocale({ serverId: this.event.guildId })
        await this.reply(t.bye())
        await this.event.channel?.delete("user requested delete")
    }
}
