import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ChannelType, LabelBuilder, ModalBuilder, TextInputStyle } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import { createStatusEmbed } from '../utils/embeds.js';

export class RenameButtonHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== 'rename') return this.none();
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
        .setCustomId("rename")
        .setTitle("Переименовать канал")
    const label = new LabelBuilder()
      .setLabel("Название:")
      .setTextInputComponent((builder) => {
        return builder
          .setCustomId("name")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(100)
          .setRequired(true)
          .setPlaceholder("Название канала")
      })
    modal.addLabelComponents(label)
    await interaction.showModal(modal)
    try {
      const submitted = await interaction.awaitModalSubmit({
        filter: (i) => i.customId == "rename" && i.user.id == interaction.user.id,
        time: 60 * 1000
      })
      const name = submitted.fields.getTextInputValue("name")
      await submitted.reply({ embeds: [createStatusEmbed(interaction.user, "Имя канала успешно изменено", "success")]})
      await interaction.channel.setName(name)
    } catch (err) {}
  }
}