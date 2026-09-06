import { ContainerBuilder, LabelBuilder, ModalBuilder } from "@discordjs/builders"
import {
    SlashRoute,
    SlashHandler,
    Emojis,
    Gated,
    RequirePermissions,
    ButtonRoute,
    ButtonHandler,
    ModalRoute,
    ModalHandler,
    RequireBotPermissions
} from "@seedcord/gateway"
import { ButtonStyle, ChannelType, PermissionFlagsBits, TextInputStyle } from "discord.js"

import { database } from "../utils/base"
import { basicColor } from "../utils/consts"
import {
    EditCategoryId,
    EditCategoryModalId,
    EditCreatorId,
    EditCreatorModalId,
    EditLanguageId,
    EditLanguageModalId,
    EditTemplateId,
    EditTemplateModalId
} from "../utils/interactionIds"
import { getLocale } from "../utils/misc"
import { NoticeCard } from "../utils/preconditions"

@Gated(RequirePermissions([PermissionFlagsBits.ManageGuild]))
@SlashRoute("settings")
export class Settings extends SlashHandler<"settings"> {
    public async execute(): Promise<void> {
        const [settings, t] = await Promise.all([
            database.findServer(this.event.guildId),
            getLocale({ serverId: this.event.guildId }),
            this.defer({ ephemeral: false })
        ])
        const current = t.settings.current()
        const edit = t.settings.edit()
        const voiceChannel = settings?.voiceChannel ? `<#${settings.voiceChannel}>` : t.settings.notSet()
        const voiceCategory = settings?.voiceCategory ? `<#${settings.voiceCategory}>` : t.settings.notSet()
        const container = new ContainerBuilder()
            .addTextDisplayComponents((builder) => builder.setContent(`### ${t.settings.configuring()}`))
            .addSectionComponents((builder) =>
                builder
                    .addTextDisplayComponents((builder) =>
                        builder.setContent(`${t.settings.voiceChannel()}\n-# ${current}: ${voiceChannel}`)
                    )
                    .setButtonAccessory((builder) =>
                        builder
                            .setCustomId(EditCreatorId.encode({}))
                            .setEmoji(Emojis.edit)
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(edit)
                    )
            )
            .addSectionComponents((builder) =>
                builder
                    .addTextDisplayComponents((builder) =>
                        builder.setContent(
                            `${t.settings.category()}\n-# ${current}: ${voiceCategory}`
                        )
                    )
                    .setButtonAccessory((builder) =>
                        builder
                            .setCustomId(EditCategoryId.encode({}))
                            .setEmoji(Emojis.edit)
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(edit)
                    )
            )
            .addSectionComponents((builder) =>
                builder
                    .addTextDisplayComponents((builder) =>
                        builder.setContent(
                            `${t.settings.template()}\n-# ${current}: ${settings?.template ?? t.setup.template()}`
                        )
                    )
                    .setButtonAccessory((builder) =>
                        builder
                            .setCustomId(EditTemplateId.encode({}))
                            .setEmoji(Emojis.edit)
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(edit)
                    )
            )
            .addSectionComponents((builder) =>
                builder
                    .addTextDisplayComponents((builder) =>
                        builder.setContent(`${t.settings.language()}\n-# ${current}: ${settings?.language ?? "en"}`)
                    )
                    .setButtonAccessory((builder) =>
                        builder
                            .setCustomId(EditLanguageId.encode({}))
                            .setEmoji(Emojis.edit)
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(edit)
                    )
            )
        await this.edit({ components: [container] })
    }
}

@Gated(
    RequirePermissions([PermissionFlagsBits.ManageGuild]),
    RequireBotPermissions([PermissionFlagsBits.ManageChannels])
)
@ButtonRoute(EditCreatorId)
export class EditCreator extends ButtonHandler<[typeof EditCreatorId]> {
    public async execute(): Promise<void> {
        const [settings, t] = await Promise.all([
            database.findServer(this.event.guildId),
            getLocale({ serverId: this.event.guildId })
        ])
        const label = new LabelBuilder().setLabel(t.settings.selectChannel()).setChannelSelectMenuComponent((builder) =>
            builder
                .addChannelTypes([ChannelType.GuildVoice])
                .setMinValues(0)
                .setMaxValues(1)
                .setDefaultChannels(settings?.voiceChannel ? [settings.voiceChannel] : [])
                .setRequired(false)
                .setCustomId("channel")
        )
        const modal = new ModalBuilder()
            .setCustomId(EditCreatorModalId.encode({}))
            .setTitle(t.settings.changingCreatorChannel())
            .addLabelComponents(label)
        await this.showModal(modal)
    }
}

@ModalRoute(EditCreatorModalId)
export class EditCreatorModal extends ModalHandler<[typeof EditCreatorModalId]> {
    public async execute(): Promise<void> {
        const [t] = await Promise.all([getLocale({ serverId: this.event.guildId }), this.defer()])
        await database.editServerIfExists({
            id: this.event.guildId,
            voiceChannel:
                this.event.fields.getSelectedChannels("channel", false, [ChannelType.GuildVoice])?.first()?.id ?? null
        })
        await this.edit({
            components: [new NoticeCard(t.settings.success(), t.settings.settings(), basicColor).component]
        })
    }
}

@Gated(RequirePermissions([PermissionFlagsBits.ManageGuild]))
@ButtonRoute(EditCategoryId)
export class EditCategory extends ButtonHandler<[typeof EditCategoryId]> {
    public async execute(): Promise<void> {
        const [settings, t] = await Promise.all([
            database.findServer(this.event.guildId),
            getLocale({ serverId: this.event.guildId })
        ])
        const label = new LabelBuilder().setLabel(t.settings.selectChannel()).setChannelSelectMenuComponent((builder) =>
            builder
                .addChannelTypes([ChannelType.GuildCategory])
                .setMinValues(0)
                .setMaxValues(1)
                .setDefaultChannels(settings?.voiceCategory ? [settings.voiceCategory] : [])
                .setRequired(false)
                .setCustomId("channel")
        )
        const modal = new ModalBuilder()
            .setCustomId(EditCategoryModalId.encode({}))
            .setTitle(t.settings.changingCategory())
            .addLabelComponents(label)
        await this.showModal(modal)
    }
}

@ModalRoute(EditCategoryModalId)
export class EditCategoryModal extends ModalHandler<[typeof EditCategoryModalId]> {
    public async execute(): Promise<void> {
        const [t] = await Promise.all([getLocale({ serverId: this.event.guildId }), this.defer()])
        await database.editServerIfExists({
            id: this.event.guildId,
            voiceCategory:
                this.event.fields.getSelectedChannels("channel", false, [ChannelType.GuildCategory])?.first()?.id ??
                null
        })
        await this.edit({
            components: [new NoticeCard(t.settings.success(), t.settings.settings(), basicColor).component]
        })
    }
}

@Gated(RequirePermissions([PermissionFlagsBits.ManageGuild]))
@ButtonRoute(EditTemplateId)
export class EditTemplate extends ButtonHandler<[typeof EditTemplateId]> {
    public async execute(): Promise<void> {
        const [settings, t] = await Promise.all([
            database.findServer(this.event.guildId),
            getLocale({ serverId: this.event.guildId })
        ])
        const label = new LabelBuilder().setLabel(t.settings.templateInput()).setTextInputComponent((builder) =>
            builder
                .setMinLength(1)
                .setMaxLength(60)
                .setCustomId("template")
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
                .setValue(settings?.template ?? t.setup.template())
        )
        const modal = new ModalBuilder()
            .setCustomId(EditTemplateModalId.encode({}))
            .setTitle(t.settings.changingTemplate())
            .addLabelComponents(label)
        await this.showModal(modal)
    }
}

@ModalRoute(EditTemplateModalId)
export class EditTemplateModal extends ModalHandler<[typeof EditTemplateModalId]> {
    public async execute(): Promise<void> {
        const [t] = await Promise.all([getLocale({ serverId: this.event.guildId }), this.defer()])
        await database.editServerIfExists({
            id: this.event.guildId,
            template: this.event.fields.getTextInputValue("template")
        })
        await this.edit({
            components: [new NoticeCard(t.settings.success(), t.settings.settings(), basicColor).component]
        })
    }
}

@Gated(RequirePermissions([PermissionFlagsBits.ManageGuild]))
@ButtonRoute(EditLanguageId)
export class EditLanguage extends ButtonHandler<[typeof EditLanguageId]> {
    public async execute(): Promise<void> {
        const t = await getLocale({ serverId: this.event.guildId })
        const label = new LabelBuilder().setLabel(t.settings.language()).setStringSelectMenuComponent((builder) =>
            builder
                .setCustomId("language")
                // would be good to move this to a separate file to use together with changechannel.ts for DRY
                .addOptions([
                    {
                        label: "English",
                        value: "en"
                    },
                    {
                        label: "Беларуская мова (Belarusian)",
                        value: "be"
                    },
                    {
                        label: "Русский язык (Russian)",
                        value: "ru"
                    }
                ])
        )
        const modal = new ModalBuilder()
            .setCustomId(EditLanguageModalId.encode({}))
            .setTitle(t.settings.selectLanguage())
            .addLabelComponents(label)
        await this.showModal(modal)
    }
}

@ModalRoute(EditLanguageModalId)
export class EditLanguageModal extends ModalHandler<[typeof EditLanguageModalId]> {
    public async execute(): Promise<void> {
        const [t] = await Promise.all([getLocale({ serverId: this.event.guildId }), this.defer()])
        await database.editServerIfExists({
            id: this.event.guildId,
            language: this.event.fields.getStringSelectValues("language")[0] ?? "en"
        })
        await this.edit({
            components: [new NoticeCard(t.settings.success(), t.settings.settings(), basicColor).component]
        })
    }
}
