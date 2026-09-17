import "envapt/config"

export const basicColor = 0x11_19_84
export const failureColor = 0xff_00_00
// 32 is limit for usernames
export const templateMaxLength = 100 - 32
export const lavalinkEnabled = Boolean(process.env.LAVALINK_PASS && process.env.LAVALINK_URL)
