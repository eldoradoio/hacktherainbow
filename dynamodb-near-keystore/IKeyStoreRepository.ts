export interface IKeyStoreRepository {
    get(networkId: string, accountId: string): Promise<NearAccountData>
    save(account: NearAccountData): Promise<NearAccountData>
}

export type NearAccountData = {
    networkId: string
    accountId: string
    content: string
}