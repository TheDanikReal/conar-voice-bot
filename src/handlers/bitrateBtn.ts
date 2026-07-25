import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ChannelType, LabelBuilder, ModalBuilder, TextInputStyle } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import { createStatusEmbed } from '../utils/embeds.js';

export class BitrateButtonHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    console.log(interaction.customId)
    if (interaction.customId !== 'bitrate') return this.none();
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
      .setCustomId("changeBitrate")
      .setTitle("Установить битрейт")
    const label = new LabelBuilder()
      .setLabel("Введите число:")
      .setTextInputComponent((builder) => {
        return builder
          .setCustomId("bitrate")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(3)
          .setRequired(true)
          .setPlaceholder("8 - 384")
      })
    modal.addLabelComponents(label)
    await interaction.showModal(modal)
    try {
      const submitted = await interaction.awaitModalSubmit({
        filter: (i) => i.customId == "changeBitrate" && i.user.id == interaction.user.id,
        time: 60 * 1000
      })
      const bitrate = parseInt(submitted.fields.getTextInputValue("bitrate").trim(), 10) * 1000
      if (bitrate < 8 || bitrate > 384) return await interaction.reply({ embeds: [createStatusEmbed(interaction.user, ":warning: Введённый битрейт выходит за допустимые рамки!", "fail")] })
      await submitted.reply({
        embeds: [createStatusEmbed(interaction.user, `Установлен битрейт ${bitrate} kbps. ✅`, "success")]
      })
      await interaction.channel.setBitrate(bitrate)
    } catch (err) {}
  }
}