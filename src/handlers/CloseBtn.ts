import { ButtonHandler, ButtonRoute } from '@seedcord/gateway';

import { database } from '../utils/base';
import { CloseId } from '../utils/interactionIds';

@ButtonRoute(CloseId)
export class CloseButton extends ButtonHandler<[typeof CloseId]> {
    public async execute(): Promise<void> {
        const channel = this.event.channel;
        if (!channel) return;
        const settings = await database.findChannel(channel?.id);
        settings;
    }
}
