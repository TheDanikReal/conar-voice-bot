import { SlashRoute, SlashHandler } from "@seedcord/gateway"
import { ContainerBuilder } from "@discordjs/builders"

@SlashRoute("cat")
export class Cat extends SlashHandler<"cat"> {
    public async execute(): Promise<void> {
        const catPromise = fetch("https://cataas.com/cat", {
            headers: {
                Accept: "application/json"
            }
        })
        await this.defer({ ephemeral: false })
        const cat = await catPromise
        const catObject = (await cat.json()) as { tags: string[]; url: string }
        await this.edit({
            components: [
                new ContainerBuilder()
                    .addTextDisplayComponents((builder) => builder.setContent(`### Tags: ${catObject.tags.join(", ")}`))
                    .addMediaGalleryComponents((builder) =>
                        builder.addItems((mediaGalleryItem) =>
                            mediaGalleryItem.setDescription("A cat from CatAAS").setURL(catObject.url)
                        )
                    )
            ]
        })
    }
}
