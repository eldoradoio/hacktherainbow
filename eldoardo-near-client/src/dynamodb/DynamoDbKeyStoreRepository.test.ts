import { ConfigureAwsEnvironment } from './test_utils'
import { DynamoDbKeyStoreRepository } from './DynamoDbKeyStoreRepository';

describe('Dynamo DB repositories', () => {

    beforeAll(async () => {
       await ConfigureAwsEnvironment();
    })
    

    test('Keystore repo', async () => {
        const repo = new DynamoDbKeyStoreRepository();
        const key= {
            accountId: 'account-1',
            networkId: 'network-1',
            content: 'this is a json'
        }
        const savedKey = await repo.save(key)
        const foundKey= await repo.get(key.networkId, key.accountId)

        expect(key).toEqual(foundKey)
        expect(savedKey).toEqual(foundKey)
    })
})