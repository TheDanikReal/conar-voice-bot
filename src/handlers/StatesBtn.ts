import { ButtonHandler, ButtonRoute, Gated } from "@seedcord/gateway";
import { StatesId } from "../utils/interactionIds";
import { CheckRights } from "../utils/preconditions";

@Gated(CheckRights())
@ButtonRoute(StatesId)
export class ManageStatesBtn extends ButtonHandler<[typeof StatesId]> {
    public async execute(): Promise<void> {
        
    }
}