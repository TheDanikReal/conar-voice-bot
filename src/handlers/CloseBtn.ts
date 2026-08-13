import { ButtonHandler, ButtonRoute, Gated } from "@seedcord/gateway"

import { CloseId } from "../utils/interactionIds"
import { CheckRights } from "../utils/preconditions"

@Gated(CheckRights())
@ButtonRoute(CloseId)
export class CloseButton extends ButtonHandler<[typeof CloseId]> {
    public async execute(): Promise<void> {
        await this.reply(`Not implemented yet`)
    }
}
