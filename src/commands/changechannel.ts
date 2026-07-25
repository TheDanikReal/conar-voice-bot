//import { isMessageInstance } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import { ChannelType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { database } from '../base.js';

export class ChangeChannel extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      requiredUserPermissions: [PermissionFlagsBits.ManageGuild]
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('setchannel')
        .setDescription('set channel for voice creating')
        .addChannelOption((builder) => builder
          .setName("channel")
          .setDescription("voice channel to use")
          .addChannelTypes(ChannelType.GuildVoice)
          .setRequired(true))
        .addChannelOption((builder) => builder
          .setName("category")
          .setDescription("category for temp channels")
          .addChannelTypes(ChannelType.GuildCategory)
          .setRequired(true))
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const callbackResponse = await interaction.reply({
      content: `Changing channel`,
      withResponse: true,
      flags: MessageFlags.Ephemeral
    });
    const msg = callbackResponse.resource?.message;

    if (!interaction.guildId) return interaction.editReply("not in server")
    if (msg) {// && isMessageInstance(msg)) {
      await database.editServerIfExists(interaction.guildId!,
        interaction.options.getChannel("channel", true, [ChannelType.GuildVoice]).id,
        interaction.options.getChannel("category", true, [ChannelType.GuildCategory]).id)
      return interaction.editReply(`success`);
    }

    return interaction.editReply('Failed to retrieve ping :(');
  }
}