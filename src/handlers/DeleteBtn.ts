import { ButtonHandler, ButtonRoute, Gated } from "@seedcord/gateway"

import { database } from "../utils/base"
import { DeleteId } from "../utils/interactionIds"
import { getLocale } from "../utils/misc"
import { CheckOwnerRights, NoRights } from "../utils/preconditions"

@Gated(CheckOwnerRights)
@ButtonRoute(DeleteId)
export class DeleteButton extends ButtonHandler<[typeof DeleteId]> {
    public async execute(): Promise<void> {
        const [t, settings] = await Promise.all([
            getLocale({ serverId: this.event.guildId }),
            database.findChannel(this.event.channelId)
        ])
        if (this.event.user.id !== settings?.ownerId) throw new NoRights("owner")
        await this.reply(t.bye())
        await this.event.channel?.delete(t.userRequestedDelete())
    }
}
