import { CustomId } from "@seedcord/gateway"

export const BitrateId = new CustomId("bitrate")
export const BitrateModalId = new CustomId("changeBitrate")

export const MemberLimitId = new CustomId("memberLimit")
export const MemberLimitModalId = new CustomId("memberLimitModal")

export const RenameId = new CustomId("rename")
export const RenameModalId = new CustomId("renameModal")

export const InvitesId = new CustomId("invites")
export const InvitesActionId = new CustomId("action").snowflake("userId").oneOf("choice", ["approve", "deny"])

export const DeleteId = new CustomId("delete")

export const CloseId = new CustomId("close")

export const ManageMembersId = new CustomId("manage")
export const KickMemberId = new CustomId("kick")
export const KickMemberModalId = new CustomId("kickmodal")
export const BlacklistId = new CustomId("blacklist")
export const BlacklistModalId = new CustomId("blacklistmodal")
export const ManagersId = new CustomId("managers")
export const ManagersModalId = new CustomId("managersmodal")

export const StatesId = new CustomId("states")
export const SaveState = new CustomId("savestate").int("slot")
export const LoadState = new CustomId("loadstate").int("slot")
export const DeleteCurrentState = new CustomId("deletestate").int("slot")
