import { NearAccount, NearTransfer } from ".";

export interface INearAccounts {
    createWallet(identifier: string): Promise<NearAccount>;
    getWallet(identifier: string): Promise<NearAccount | undefined>;
    transferFrom(from: string, to: string, amount: string): Promise<NearTransfer>
    transfer(to: string, amount: string): Promise<NearTransfer>
    getTransfer(txHash: string): Promise<NearTransfer | undefined> 
}