import { NearAccounts } from ".";
import { DynamoDbKeyStore } from "./DynamoDbKeyStore";
import { KeyStoreRepositoryMock } from "./__mocks__/IKeyStoreRepository";

describe('Near provider', ()=>{
    test('Wallet', async ()=>{
        const dynamoDbKeyStoreRepository = new KeyStoreRepositoryMock()
        const dynamoDbKeyStore = new DynamoDbKeyStore(dynamoDbKeyStoreRepository)
        const nearAccounts = new NearAccounts(dynamoDbKeyStore)
        const today = new Date(Date.now()).getTime()
        await nearAccounts.createWallet(`user-${today}`)
    })
})