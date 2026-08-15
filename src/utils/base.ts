import { PrismaPg } from "@prisma/adapter-pg"
import { LRUCache } from "lru-cache"

import { PrismaClient } from "../generated/prisma/client.js"

import type { Prisma } from "../generated/prisma/client.js"
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
        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
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
        }
        const server = await this.prisma.serverSettings.findFirst({
            where: {
                id: serverId
            }
        })
        this.cacheServers.set(serverId, { ...server })
        return server
    }
    async addServer(data: Prisma.ServerSettingsCreateInput) {
        this.cacheServers.set(data.id, data)
        return await this.prisma.serverSettings.create({
            data
        })
    }
    async editServerIfExists(data: Prisma.ServerSettingsCreateInput) {
        this.cacheServers.set(data.id, data)
        if (
            await this.prisma.serverSettings.findFirst({
                where: {
                    id: data.id
                }
            })
        ) {
            return await this.prisma.serverSettings.update({
                where: {
                    id: data.id
                },
                data
            })
        }
        return await this.prisma.serverSettings.create({
            data
        })
    }
    async findChannel(channelId: string) {
        const cachedChannel = this.cacheChannels.get(channelId)
        if (cachedChannel) {
            return cachedChannel
        }
        const channel = await this.prisma.tempChannel.findFirst({
            where: {
                id: channelId
            }
        })
        this.cacheChannels.set(channelId, { ...channel })
        return channel
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
        }
        return await this.prisma.tempChannel.create({
            data: {
                id: channelId,
                ...details
            }
        })
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
        this.patchCachedChannel(channelId, { requests: !requestsEnabled })
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
    async toggleClosed(channelId: string) {
        const data = await this.prisma.tempChannel.findUnique({
            where: {
                id: channelId
            }
        })
        const isClosed = data?.closed ?? false
        await this.prisma.tempChannel.update({
            where: {
                id: channelId
            },
            data: {
                closed: !isClosed
            }
        })
        this.patchCachedChannel(channelId, { closed: !isClosed })
        return !isClosed
    }
    async changeMaxMembers(channelId: string, maxMembers: number) {
        await this.prisma.tempChannel.update({
            where: {
                id: channelId
            },
            data: {
                maxMembers
            }
        })
        this.patchCachedChannel(channelId, { maxMembers })
    }
    async changeManagers(channelId: string, managers: string[]) {
        await this.prisma.tempChannel.update({
            where: {
                id: channelId
            },
            data: {
                managers
            }
        })
        this.patchCachedChannel(channelId, { managers })
    }
    async changeBlacklist(channelId: string, blacklist: string[]) {
        await this.prisma.tempChannel.update({
            where: {
                id: channelId
            },
            data: {
                blacklist
            }
        })
        this.patchCachedChannel(channelId, { blacklist })
    }
    private patchCachedChannel(channelId: string, patch: Partial<Prisma.TempChannelCreateInput>) {
        const cachedChannel = this.cacheChannels.get(channelId)
        if (cachedChannel) {
            this.cacheChannels.set(channelId, {
                ...cachedChannel,
                ...patch
            })
        }
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
        return await this.prisma.user.create({
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
