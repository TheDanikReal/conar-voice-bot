import { ButtonHandler, ButtonRoute, Emojis, Gated, ModalHandler, ModalRoute } from "@seedcord/gateway"
import { BlacklistId, KickMemberId, KickMemberModalId, ManageMembersId, ManagersId } from "../utils/interactionIds"
import { CheckRights, UserNotFound } from "../utils/preconditions"
import { ContainerBuilder, LabelBuilder, ModalBuilder } from "@discordjs/builders"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, TextInputStyle } from "discord.js"
import { basicColor } from "../utils/consts"

@Gated(CheckRights())
@ButtonRoute(ManageMembersId)
export class ManageMembersBtn extends ButtonHandler<[typeof ManageMembersId]> {
    public async execute(): Promise<void> {
        const kickButton = new ButtonBuilder()
            .setCustomId(KickMemberId.encode({}))
            .setEmoji(Emojis.kick.id)
            .setStyle(ButtonStyle.Secondary)
        const blacklistButton = new ButtonBuilder()
            .setCustomId(BlacklistId.encode({}))
            .setEmoji(Emojis.lock.id)
            .setStyle(ButtonStyle.Secondary)
        const managersButton = new ButtonBuilder()
            .setCustomId(ManagersId.encode({}))
            .setEmoji(Emojis.mod.id)
            .setStyle(ButtonStyle.Secondary)
        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            kickButton,
            blacklistButton,
            managersButton
        )
        await this.reply({
            components: [
                new ContainerBuilder().setAccentColor(basicColor).addTextDisplayComponents((builder) =>
                    builder.setContent(`## Managing members
${Emojis.kick} - Kick member
${Emojis.lock} - Manage channel's blacklist
${Emojis.mod} - Manage channel's managers
`)
                ),
                buttonRow
            ]
        })
        // todo: add buttons to actually do these actions
        // i think users to kick should be chosen by a select menu btw
    }
}

@ButtonRoute(KickMemberId)
export class KickMemberBtn extends ButtonHandler<[typeof KickMemberId]> {
    public async execute(): Promise<void> {
        // for reverse compatibility with Conor and
        // ease of development currently i'm going to
        // make it a modal with user id input, but
        // todo: i want it to be a select menu when channel
        // has <=25 (limit for select menus) members in future
        const modal = new ModalBuilder().setCustomId(KickMemberModalId.encode({})).setTitle("Kick member")
        const label = new LabelBuilder()
            .setLabel("Input id or username")
            .setTextInputComponent((builder) =>
                builder
                    .setCustomId("id")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder(`danikcool, 1234567890`)
            )
        modal.addLabelComponents(label)
        await this.showModal(modal)
    }
}

@ModalRoute(KickMemberModalId)
export class KickMemberModal extends ModalHandler<[typeof KickMemberModalId]> {
    public async execute(): Promise<void> {
        await this.defer()
        let id = this.event.fields.getTextInputValue("id").trim()
        const isSnowflake = /^\d{17,20}$/.test(id)
        if (!isSnowflake) {
            const cacheId = this.event.client.users.cache.find((user) => user.username === id)?.id
            if (!cacheId) throw new UserNotFound()
            id = cacheId
        }
        // todo: kick user
    }
}
