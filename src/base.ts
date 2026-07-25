import type { Prisma } from "./generated/prisma/client.js"
import { LRUCache } from "lru-cache"
import { PrismaClient } from "./generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

class PrismaDatabase {
    prisma: PrismaClient
    cacheServers: LRUCache<string, Partial<Prisma.ServerSettingsCreateInput>>
    cacheChannels: LRUCache<string, Partial<Prisma.TempChannelCreateInput>>
    constructor() {
        this.cacheServers = new LRUCache<string, Partial<Prisma.ServerSettingsCreateInput>>({
            ttl: 1000 * 60 * 30,
            max: 100
        })
        this.cacheChannels = new LRUCache<string, Partial<Prisma.TempChannelCreateInput>>({
            ttl: 1000 * 60 * 30,
            max: 100
        })
        const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]})
        this.prisma = new PrismaClient({ adapter })
    }
    async connect() {
        await this.prisma.$connect()
    }
    async disconnect() {
        await this.prisma.$disconnect()
    }
    /*async users() {
        return await this.prisma.user.findMany()
    }*/
    async findServer(serverId: string) {
        const cachedServer = this.cacheServers.get(serverId)
        if (cachedServer) {
            return cachedServer
        } else {
            const server = await this.prisma.serverSettings.findFirst({
                where: {
                    id: serverId
                }
            })
            this.cacheServers.set(serverId, { ...server })
            return server
        }
    }
    async addServer(serverId: string, voiceChannel: string, category: string) {
        this.cacheServers.set(serverId, { id: serverId, voiceChannel, voiceCategory: category })
        return await this.prisma.serverSettings.create({
            data: {
                id: serverId,
                voiceChannel,
                voiceCategory: category
            }
        })
    }
    async editServerIfExists(serverId: string, voiceChannel: string, category: string) {
        this.cacheServers.set(serverId, { id: serverId, voiceChannel, voiceCategory: category })
        if (
            await this.prisma.serverSettings.findFirst({
                where: {
                    id: serverId
                }
            })
        ) {
            return await this.prisma.serverSettings.update({
                where: {
                    id: serverId
                },
                data: {
                    voiceChannel,
                    voiceCategory: category
                }
            })
        } else {
            return await this.prisma.serverSettings.create({
                data: {
                    id: serverId,
                    voiceChannel,
                    voiceCategory: category
                }
            })
        }
    }
    async findChannel(channelId: string) {
        const cachedChannel = this.cacheChannels.get(channelId)
        if (cachedChannel) {
            return cachedChannel
        } else {
            const channel = await this.prisma.tempChannel.findFirst({
                where: {
                    id: channelId
                }
            })
            this.cacheChannels.set(channelId, { ...channel })
            return channel
        }
    }
    async addChannel(channelId: string, details: Omit<Prisma.TempChannelCreateInput, "id">) {
        this.cacheChannels.set(channelId, { id: channelId, ...details })
        return await this.prisma.tempChannel.create({
            data: {
                id: channelId,
                ...details
            }
        })
    }
    async editChannelIfExists(channelId: string, details: Omit<Prisma.TempChannelCreateInput, "id">) {
        this.cacheChannels.set(channelId, { id: channelId, ...details })
        if (
            await this.prisma.tempChannel.findFirst({
                where: {
                    id: channelId
                }
            })
        ) {
            return await this.prisma.tempChannel.update({
                where: {
                    id: channelId
                },
                data: {
                    ...details
                }
            })
        } else {
            return await this.prisma.tempChannel.create({
                data: {
                    id: channelId,
                    ...details
                }
            })
        }
    }
    async deleteChannel(channelId: string) {
        return await this.prisma.tempChannel.delete({
            where: {
                id: channelId
            }
        })
    }
    async toggleInvites(channelId: string) {
        const data = await this.prisma.tempChannel.findFirst({
            where: {
                id: channelId
            }
        })
        const requestsEnabled = data?.requests
        await this.prisma.tempChannel.update({
            where: {
                id: channelId
            },
            data: {
                requests: !requestsEnabled
            }
        })
        this.cacheChannels.set(channelId, { ...data })
        return !requestsEnabled
    }
    async areInvitesEnabled(channelId: string) {
        const data = await this.prisma.tempChannel.findFirst({
            where: {
                id: channelId
            }
        })
        return data?.requests
    }
    /*async findUser(userId: string) {
        const cachedUser = this.cacheUsers.get(userId)
        if (cachedUser) {
            return cachedUser
        } else {
            const user = await this.prisma.user.findFirst({
                where: {
                    id: userId
                }
            })
            this.cacheUsers.set(userId, { ...user })
            return user
        }
    }
    // deno-lint-ignore require-await
    async addUser(userId: string, model: string) {
        this.cacheUsers.set(userId, { id: userId, model })
        return this.prisma.user.create({
            data: {
                id: userId,
                model
            }
        })
    }
    async editUser(userId: string, newData: Partial<Prisma.UserCreateInput>) {
        this.cacheUsers.set(userId, { id: userId, ...newData })
        return await this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                ...newData
            }
        })
    }
    async editUserIfExists(userId: string, model: string) {
        this.cacheUsers.set(userId, { id: userId, model })
        if (
            await this.prisma.user.findFirst({
                where: {
                    id: userId
                }
            })
        ) {
            return this.prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    model
                }
            })
        } else {
            return this.prisma.user.create({
                data: {
                    id: userId,
                    model
                }
            })
        }
    }*/
}

export const database = new PrismaDatabase()

// const users = await database.users()
// await database.connect()