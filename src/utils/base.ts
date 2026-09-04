import postgres from "@prisma/orm-postgres/runtime"
import { LRUCache } from "lru-cache"
import "dotenv/config"

import contractJson from "../generated/prisma/contract.json" with { type: "json" }

import type { Contract } from "../generated/prisma/contract.js"
import type { CreateInput } from "@prisma/orm-postgres/orm-client"
import type { PostgresClient } from "@prisma/orm-postgres/runtime"

type ServerSettingsCreateInput = CreateInput<Contract, "ServerSettings", "public">
type TempChannelCreateInput = CreateInput<Contract, "TempChannel", "public">
type UserSettingsCreateInput = CreateInput<Contract, "UserSettings", "public">
type SaveCreateInput = CreateInput<Contract, "Save", "public">

class PrismaDatabase {
    db: PostgresClient<Contract>
    cacheServers: LRUCache<string, Partial<ServerSettingsCreateInput>>
    cacheChannels: LRUCache<string, Partial<TempChannelCreateInput>>
    cacheUsers: LRUCache<string, Partial<UserSettingsCreateInput>>
    cacheSaves: LRUCache<string, Partial<SaveCreateInput>>
    constructor() {
        // this feels weird but because of no-magic-numbers i should do that
        const thirtyMinutes = 1000 * 60 * 30
        this.cacheServers = new LRUCache({
            ttl: thirtyMinutes,
            max: 100
        })
        this.cacheChannels = new LRUCache({
            ttl: thirtyMinutes,
            max: 100
        })
        this.cacheUsers = new LRUCache({
            ttl: thirtyMinutes,
            max: 100
        })
        this.cacheSaves = new LRUCache({
            ttl: thirtyMinutes,
            max: 100
        })
        this.db = postgres<Contract>({ url: process.env.DATABASE_URL!, contractJson })
    }
    async connect() {
        await this.db.connect()
    }
    async disconnect() {
        await this.db.close()
    }
    async findServer(serverId: string) {
        const cachedServer = this.cacheServers.get(serverId)
        if (cachedServer) {
            return cachedServer
        }
        const server = await this.db.orm.public.ServerSettings.where({ id: serverId }).first()
        if (server) {
            this.cacheServers.set(serverId, { ...server })
        }
        return server
    }
    async addServer(data: ServerSettingsCreateInput) {
        this.cacheServers.set(data.id, data)
        return await this.db.orm.public.ServerSettings.create({
            ...data
        })
    }
    async editServerIfExists(data: ServerSettingsCreateInput) {
        const settings = await this.db.orm.public.ServerSettings.where({ id: data.id }).upsert({
            update: data,
            create: data
        })
        this.cacheServers.set(data.id, settings)
        return settings
    }
    async removeServerTempChannel(serverId: string) {
        const settingsRecord = this.db.orm.public.ServerSettings.where({ id: serverId })
        if (!(await settingsRecord.first())) return

        await settingsRecord.update({
            voiceChannel: null
        })
        this.patchCachedServer(serverId, { voiceChannel: null })
    }
    async findChannel(channelId: string) {
        const cachedChannel = this.cacheChannels.get(channelId)
        if (cachedChannel) {
            return cachedChannel
        }
        const channel = await this.db.orm.public.TempChannel.where({ id: channelId }).first()
        if (channel) {
            this.cacheChannels.set(channelId, { ...channel })
        }
        return channel
    }
    async addChannel(channelId: string, details: Omit<TempChannelCreateInput, "id">) {
        this.cacheChannels.set(channelId, { id: channelId, ...details })
        return await this.db.orm.public.TempChannel.create({
            id: channelId,
            ...details
        })
    }
    async editChannel(channelId: string, details: Partial<Omit<TempChannelCreateInput, "id">>) {
        const updated = await this.db.orm.public.TempChannel.where({ id: channelId }).update({
            ...details
        })
        this.patchCachedChannel(channelId, details)
        return updated
    }
    async editChannelIfExists(channelId: string, details: Omit<TempChannelCreateInput, "id">) {
        this.cacheChannels.set(channelId, { id: channelId, ...details })
        return await this.db.orm.public.TempChannel.where({ id: channelId }).upsert({
            update: details,
            create: {
                id: channelId,
                ...details
            }
        })
    }
    async deleteChannel(channelId: string) {
        const result = await this.db.orm.public.TempChannel.where({ id: channelId }).delete()
        this.cacheChannels.delete(channelId)
        return result
    }
    async findUser(userId: string) {
        const cachedUser = this.cacheUsers.get(userId)
        if (cachedUser) {
            return cachedUser
        }
        const user = await this.db.orm.public.UserSettings.where({ userId }).first()
        if (user) {
            this.cacheUsers.set(userId, { ...user })
        }
        return user
    }
    async addUser(userId: string) {
        const data = await this.db.orm.public.UserSettings.where({ userId }).upsert({
            create: { userId },
            update: {}
        })
        this.cacheUsers.set(userId, { ...data })
        return data
    }
    async findSave(userId: string, slotNum: number) {
        // that feels bad, would have potential collisions, but ig it's fine for now?
        const cachedSave = this.cacheSaves.get(userId + slotNum.toString())
        if (cachedSave) {
            return cachedSave
        }
        const save = await this.db.orm.public.Save.where({
            userId,
            slotNum
        }).first()
        if (save) {
            this.patchCachedSave(userId + slotNum.toString(), save)
        }
        return save
    }
    async updateSave(userId: string, data: SaveCreateInput) {
        await this.db.orm.public.Save.where({
            userId,
            slotNum: data.slotNum
        }).upsert({
            create: data,
            update: data
        })
        this.patchCachedSave(userId + data.slotNum.toString(), data)
    }
    async deleteSave(userId: string, slotNum: number) {
        await this.db.orm.public.Save.where({ userId, slotNum }).delete()
        this.cacheSaves.delete(userId + slotNum.toString())
    }
    async toggleInvites(channelId: string) {
        const data = await this.db.orm.public.TempChannel.where({ id: channelId }).first()
        const requestsEnabled = data?.requests
        await this.db.orm.public.TempChannel.where({ id: channelId }).update({ requests: !requestsEnabled })
        this.patchCachedChannel(channelId, { requests: !requestsEnabled })
        return !requestsEnabled
    }
    async areInvitesEnabled(channelId: string) {
        const data = await this.db.orm.public.TempChannel.where({ id: channelId }).first()
        return data?.requests
    }
    async toggleClosed(channelId: string) {
        const data = await this.db.orm.public.TempChannel.where({ id: channelId }).first()
        const isClosed = data?.closed ?? false
        await this.db.orm.public.TempChannel.where({ id: channelId }).update({ closed: !isClosed })
        this.patchCachedChannel(channelId, { closed: !isClosed })
        return !isClosed
    }
    async changeMaxMembers(channelId: string, maxMembers: number) {
        await this.db.orm.public.TempChannel.where({ id: channelId }).update({ maxMembers })
        this.patchCachedChannel(channelId, { maxMembers })
    }
    async changeManagers(channelId: string, managers: string[]) {
        await this.db.orm.public.TempChannel.where({ id: channelId }).update({ managers })
        this.patchCachedChannel(channelId, { managers })
    }
    async changeBlacklist(channelId: string, blacklist: string[]) {
        await this.db.orm.public.TempChannel.where({ id: channelId }).update({ blacklist })
        this.patchCachedChannel(channelId, { blacklist })
    }
    private patchCachedChannel(channelId: string, patch: Partial<TempChannelCreateInput>) {
        const cachedChannel = this.cacheChannels.get(channelId)
        if (cachedChannel) {
            this.cacheChannels.set(channelId, {
                ...cachedChannel,
                ...patch
            })
        }
    }
    private patchCachedServer(serverId: string, patch: Partial<ServerSettingsCreateInput>) {
        const cachedServer = this.cacheServers.get(serverId)
        if (cachedServer) {
            this.cacheServers.set(serverId, {
                ...cachedServer,
                ...patch
            })
        }
    }
    private patchCachedSave(userId: string, patch: Partial<SaveCreateInput> & Pick<SaveCreateInput, "slotNum">) {
        const cachedSave = this.cacheSaves.get(userId + patch.slotNum.toString())
        if (cachedSave) {
            this.cacheSaves.set(userId + patch.slotNum.toString(), {
                ...cachedSave,
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
