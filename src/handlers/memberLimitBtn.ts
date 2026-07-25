import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ChannelType, LabelBuilder, ModalBuilder, TextInputStyle } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import { createStatusEmbed } from '../utils/embeds.js';

export class MemberLimitButtonHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    console.log(interaction.customId)
    if (interaction.customId !== 'memberLimit') return this.none();
    //todo: preconditions
    /* const precondition = this.container.stores.get("preconditions").get("ManageVoice")
    if (precondition) {
      if ((await precondition.chatInputRun(interaction)).isErr()) return this.none()
    }*/

    return this.some();
  }

  public async run(interaction: ButtonInteraction) {
    if (interaction.channel?.type != ChannelType.GuildVoice) return
    const modal = new ModalBuilder()
      .setCustomId("memberLimit")
      .setTitle("Установить лимит участников")
    const label = new LabelBuilder()
      .setLabel("Введите число:")
      .setTextInputComponent((builder) => {
        return builder
          .setCustomId("limit")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(2)
          .setRequired(true)
          .setPlaceholder("1 - 99")
      })
    modal.addLabelComponents(label)
    await interaction.showModal(modal)
    try {
      const submitted = await interaction.awaitModalSubmit({
        filter: (i) => i.customId == "memberLimit" && i.user.id == interaction.user.id,
        time: 60 * 1000
      })
      const limit = parseInt(submitted.fields.getTextInputValue("limit").trim(), 10)
      await submitted.reply({
        embeds: [createStatusEmbed(interaction.user, `Установлен лимит ${limit} участников. ✅`, "success")]
      })
      await interaction.channel.setUserLimit(limit)
    } catch (err) {}
  }
}