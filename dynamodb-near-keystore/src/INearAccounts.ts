import { NearAccount, NearTransfer } from ".";

export interface INearAccounts {
    createWallet(identifier: string): Promise<NearAccount>;
    transferFrom(from: string, to: string, amount: string): Promise<NearTransfer>
}