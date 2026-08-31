import { ContainerBuilder } from "@discordjs/builders"
import { SlashRoute, SlashHandler } from "@seedcord/gateway"
import { getLocale } from "../utils/misc"

@SlashRoute("cat")
export class Cat extends SlashHandler<"cat"> {
    public async execute(): Promise<void> {
        const catPromise = fetch("https://cataas.com/cat", {
            headers: {
                Accept: "application/json"
            }
        })
        const [t, cat] = await Promise.all([
            getLocale({ serverId: this.event.guildId }),
            catPromise,
            this.defer({ ephemeral: false })
        ])
        const catObject = (await cat.json()) as { tags: string[]; url: string }
        await this.edit({
            components: [
                new ContainerBuilder()
                    .addTextDisplayComponents((builder) =>
                        builder.setContent(`### ${t.catTags()}: ${catObject.tags.join(", ")}`)
                    )
                    .addMediaGalleryComponents((builder) =>
                        builder.addItems((mediaGalleryItem) =>
                            mediaGalleryItem.setDescription(t.catAASSource()).setURL(catObject.url)
                        )
                    )
            ]
        })
    }
}
