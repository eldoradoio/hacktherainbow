import { IKeyStoreRepository, NearAccountData } from "../IKeyStoreRepository";

export class KeyStoreRepositoryMock implements IKeyStoreRepository {
    private readonly accounts: NearAccountData[] = []


    private findIndex(networkId: string, accountId: string): number {
        return this.accounts.findIndex(x => x.networkId === networkId && x.accountId === accountId)
    }

    get(networkId: string, accountId: string): Promise<NearAccountData> {
        const found = this.findIndex(networkId, accountId)
        if (found < 0) {
            throw new Error(`Account "${accountId}" not found in network "${networkId}"`)
        }
        return Promise.resolve(this.accounts[found])
    }
    save(account: NearAccountData): Promise<NearAccountData> {
        const found = this.findIndex(account.networkId, account.accountId)
        if (found >= 0) {
            this.accounts.splice(found, 1, account)
        } else {
            this.accounts.push(account)
        }
        return Promise.resolve(account)
    }


}