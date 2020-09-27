import { NearAccount, NearAccounts } from ".";
import { AccountInfo, DynamoDbKeyStore } from "./DynamoDbKeyStore";
import { KeyStoreRepositoryMock } from "./__mocks__/IKeyStoreRepository";
import { UnencryptedFileSystemKeyStore } from 'near-api-js/lib/key_stores/unencrypted_file_system_keystore';
import { KeyPairEd25519 } from "near-api-js/lib/utils";

const CONTRACT_NAME = process.env.CONTRACT_NAME || 'juan.testnet'
const MASTER_ACCOUNT = process.env.MASTER_ACCOUNT || 'juan.testnet'

describe('Near provider', () => {


    test('Wallet', async () => {
        const { nearAccounts, dynamoDbKeyStoreRepository, network } = await init();
        const newAccount = await createAccount(nearAccounts)

        const newAccountKey = await dynamoDbKeyStoreRepository.get(network, newAccount.accountId)

        expect(newAccountKey.networkId).toBe(network)
        expect(newAccountKey.content).toBeTruthy()

        const keyInfo = JSON.parse(newAccountKey.content) as AccountInfo
        expect(keyInfo).toBeTruthy()
        expect(keyInfo.account_id).toBe(newAccountKey.accountId)
        expect(keyInfo.public_key).toBeTruthy()
        expect(keyInfo.private_key).toBeTruthy()
    })

    test('transfer', async () => {
        const { nearAccounts } = await init();

        const fromAccount = await createAccount(nearAccounts)
        const toAccount = await createAccount(nearAccounts)

        // assuming we've got enough tokens on our main account
        // we send 1 to our sender
        await nearAccounts.transfer(fromAccount.accountId, "1")

        // proceed to send that token to the receiver
        const transfer = await nearAccounts.transferFrom(fromAccount.accountId, toAccount.accountId, '1')
        const status = await nearAccounts.getTransfer(transfer.id)
        expect(status).toBeTruthy()
        expect(status?.from).toBe(fromAccount.accountId)
        expect(status?.to).toBe(toAccount.accountId)
        expect(status?.amount).toBe('1')

        const tobalance = await nearAccounts.getWallet(toAccount.accountId)
        expect(tobalance?.balance).toBe('1')
    })



})

async function init() {
    const fileKeyStore = new UnencryptedFileSystemKeyStore('/home/gitpod/.near-credentials');
    const network = (await fileKeyStore.getNetworks())[0];
    const accounts = await fileKeyStore.getAccounts(network)
    const devAccountId = accounts.find(x => x === MASTER_ACCOUNT) || accounts[0]

    const key = (await fileKeyStore.getKey(network, devAccountId)) as KeyPairEd25519;
    if (!key) {
        throw new Error('Please log in with the near cli or place the credentials file in the directory');
    }
    const dynamoDbKeyStoreRepository = new KeyStoreRepositoryMock();

    const accountInfo: AccountInfo = {
        private_key: key.secretKey,
        public_key: key.publicKey.toString(),
        account_id: devAccountId
    };

    await dynamoDbKeyStoreRepository.save({
        accountId: devAccountId,
        networkId: network,
        content: JSON.stringify(accountInfo)
    });

    const dynamoDbKeyStore = new DynamoDbKeyStore(dynamoDbKeyStoreRepository);

    const config = {
        networkId: network,
        nodeUrl: 'https://rpc.testnet.near.org',
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        masterAccount: devAccountId,
        contractName: devAccountId
    };

    const nearAccounts = new NearAccounts(config, dynamoDbKeyStore);
    return { nearAccounts, dynamoDbKeyStoreRepository, network };
}

async function createAccount(nearAccounts: NearAccounts): Promise<NearAccount> {
    const today = new Date(Date.now()).getTime()
    const newAccountId = `test-user-${today}`
    const newAccount = await nearAccounts.createWallet(newAccountId)
    return newAccount
}