import { NearAccounts } from ".";
import { AccountInfo, DynamoDbKeyStore } from "./DynamoDbKeyStore";
import { KeyStoreRepositoryMock } from "./__mocks__/IKeyStoreRepository";
import { UnencryptedFileSystemKeyStore } from 'near-api-js/lib/key_stores/unencrypted_file_system_keystore';
import { KeyPairEd25519 } from "near-api-js/lib/utils";
import { assert } from "console";


describe('Near provider', () => {
    test('Wallet', async () => {
        const fileKeyStore = new UnencryptedFileSystemKeyStore('/home/node/.near-credentials')
        const network = (await fileKeyStore.getNetworks())[0]
        const devAccountId = (await fileKeyStore.getAccounts(network))[0]
        const key = (await fileKeyStore.getKey(network, devAccountId)) as KeyPairEd25519
        if (!key) throw new Error('Please log in with the near cli or place the credentials file in the directory')

        const dynamoDbKeyStoreRepository = new KeyStoreRepositoryMock()

        const accountInfo: AccountInfo = {
            private_key: key.secretKey,
            public_key: key.publicKey.toString(),
            account_id: devAccountId
        }

        await dynamoDbKeyStoreRepository.save({
            accountId: devAccountId,
            networkId: network,
            content: JSON.stringify(accountInfo)
        })
        
        const dynamoDbKeyStore = new DynamoDbKeyStore(dynamoDbKeyStoreRepository)

        const config = {
            networkId: network,
            nodeUrl: 'https://rpc.testnet.near.org',
            walletUrl: 'https://wallet.testnet.near.org',
            helperUrl: 'https://helper.testnet.near.org',
            masterAccount: devAccountId,
            contractName : devAccountId
        }

        const nearAccounts = new NearAccounts(config, dynamoDbKeyStore)
        const today = new Date(Date.now()).getTime()
        const newAccountId = `eldorado-user-${today}`
        const newAccount = await nearAccounts.createWallet(newAccountId)

        const newAccountKey = await dynamoDbKeyStoreRepository.get(network, newAccount.accountId)
        
        expect(newAccountKey.accountId).toBe(newAccountId)
        expect(newAccountKey.networkId).toBe(network)
        expect(newAccountKey.content).toBeTruthy()

        const keyInfo = JSON.parse(newAccountKey.content) as AccountInfo
        expect(keyInfo).toBeTruthy()
        expect(keyInfo.account_id).toBe(newAccountId)
        expect(keyInfo.public_key).toBeTruthy()
        expect(keyInfo.private_key).toBeTruthy()
    })
})