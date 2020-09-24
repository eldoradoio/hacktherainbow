import { NearAccount } from ".";

export interface INearAccounts {
    createWallet(identifier: string): Promise<NearAccount>;
}