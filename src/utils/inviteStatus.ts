const inviteMap = new Map<string, string>();

export function addInvite(user: string, channelId: string) {
    inviteMap.set(user, channelId);
    setTimeout(() => {
        inviteMap.delete(user);
    }, 60 * 1000);
}
