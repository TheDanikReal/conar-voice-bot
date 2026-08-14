import { ButtonHandler, ButtonRoute, Emojis, Gated } from "@seedcord/gateway"
import { ManageMembersId } from "../utils/interactionIds"
import { CheckRights } from "../utils/preconditions"
import { ContainerBuilder } from "@discordjs/builders"
import { basicColor } from "../utils/consts"

@Gated(CheckRights())
@ButtonRoute(ManageMembersId)
export class ManageMembersBtn extends ButtonHandler<[typeof ManageMembersId]> {
    public async execute(): Promise<void> {
        await this.reply({
            components: [
                new ContainerBuilder().setAccentColor(basicColor).addTextDisplayComponents((builder) =>
                    builder.setContent(`## Managing members
${Emojis.kick} - Kick member
${Emojis.lock} - Manage channel's blacklist
${Emojis.mod} - Manage channel's managers
`)
                )
            ]
        })
        // todo: add buttons to actually do these actions
        // i think users to kick should be chosen by a select menu btw
    }
}
