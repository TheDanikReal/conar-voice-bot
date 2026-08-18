import { SlashHandler, SlashRoute } from "@seedcord/gateway"
import { ContainerBuilder, SeparatorSpacingSize } from "discord.js"

@SlashRoute("credits")
export class Credits extends SlashHandler<"credits"> {
    public async execute(): Promise<void> {
        await this.reply({
            components: [
                new ContainerBuilder()
                    .addTextDisplayComponents((builder) => builder.setContent("# Developers of carrot"))
                    .addSectionComponents((builder) =>
                        builder
                            .addTextDisplayComponents((builder) =>
                                builder.setContent(`## danikcool
Main developer of Carrot, a TypeScript hobbyist
That's it, I'm the only developer, however...`)
                            )
                            .setThumbnailAccessory((builder) =>
                                builder
                                    .setDescription("danikcool's avatar")
                                    .setURL(
                                        "https://cdn.discordapp.com/avatars/802951312873750578/8b55e2ecc716a68c4713cf5757177668.png"
                                    )
                            )
                    )
                    .addSeparatorComponents((builder) => builder.setSpacing(SeparatorSpacingSize.Small))
                    .addTextDisplayComponents((builder) => builder.setContent("# Honorable mentions"))
                    .addTextDisplayComponents((builder) =>
                        builder.setContent(`## qomineko (pronounced as komi)
Developer of original Connor bot, which inspired me to make Carrot bot`)
                    )
                    .addSectionComponents((builder) =>
                        builder
                            .addTextDisplayComponents((builder) =>
                                builder.setContent(`## materwelon
Developer of [seedcord](https://github.com/seedcord/seedcord), the best TS framework for Discord bots`)
                            )
                            .setThumbnailAccessory((builder) =>
                                builder
                                    .setDescription("materwelon's avatar")
                                    .setURL("https://avatars.githubusercontent.com/u/108764363?v=4")
                            )
                    )
            ]
        })
    }
}
