import * as nearApi from 'near-api-js/lib';
import BN from 'bn.js';
import { KeyStore } from "near-api-js/lib/key_stores";
import { INearAccounts } from './INearAccounts'

export * from './INearAccounts'
export * from './IKeyStoreRepository'
export * from './DynamoDbKeyStore'
export * from './dynamodb/DynamoDbKeyStoreRepository'

export class NearAccounts implements INearAccounts {

    private keyStore: KeyStore
    private config: NearConfig;

    constructor(config: NearConfig, keyStore: KeyStore) {

        this.keyStore = keyStore
        this.config = config
    }


    private connect(): Promise<nearApi.Near> {
        return nearApi.connect({
            ...this.config,
            deps: {
                keyStore: this.keyStore
            },
            keyStore: this.keyStore,
        });
    }

    public async createWallet(identifier: string): Promise<NearAccount> {
        const near = await this.connect()

        const mainAccount = new nearApi.Account(near.connection, this.config.masterAccount);

        const approveAmount =        new BN("4231039307375954236152")
        const createAccountAmount = new BN("16552803572267293929962")
        const noIdeaWhy =           new        BN("2991510480986748")
        const amount = createAccountAmount.add(approveAmount).add(noIdeaWhy)
        const accountId = identifier

        const keyPair = nearApi.utils.KeyPairEd25519.fromRandom();
        const publicKey = keyPair.publicKey.toString();

        await this.keyStore.setKey(this.config.networkId, accountId, keyPair);

        try {
            // This is expected to error because the account shouldn't exist
            await near.account(accountId);
            throw new Error(`Sorry, account '${accountId}' already exists.`);
        } catch (e) {
            if (!e.message.includes('does not exist while viewing')) {
                throw e;
            }
        }

        await this.keyStore.setKey(this.config.networkId, accountId, keyPair);

        const createdResponse = await mainAccount.createAccount(accountId, keyPair.getPublicKey(), amount);
        const account = new nearApi.Account(near.connection, accountId)
        
        const senderContract = this.getContract(account)
        const approved = await senderContract.approve({
            spender: mainAccount.accountId,
            tokens: 1000000 // one million preapproved kek
        })

        return {
            accountId: accountId,
            balance: '0',
            status: 'created',
            identifier: identifier,
            walletId: accountId
        }
    }

    public async transferFrom(from: string, to: string, amount: string): Promise<NearTransfer> {
        const date = new Date(Date.now()).toISOString()
        const near = await this.connect()

        const masterAccount = await near.account(this.config.masterAccount)
        const fromAccount = await near.account(from);
        const toAccount = await near.account(to);

        const masterContract = this.getContract(masterAccount)
        const tokenAmount = new BN(amount).toNumber()

        // const approved = await senderContract.approve({
        //     spender: masterAccount.accountId,
        //     tokens: tokenAmount
        // })

        // if (!approved) {
        //     throw new Error('Could not approve allowance');
        // }

        const result = await masterContract.transferFrom({ from: fromAccount.accountId, to: toAccount.accountId, tokens: tokenAmount })
        if (!result) {
            throw new Error('Could not create transfer');
        }
        return {
            from: from,
            to: to,
            amount: amount,
            date: date,
            id: ''
        }
    }

    public async transfer(to: string, amount: string): Promise<NearTransfer> {
        const date = new Date(Date.now()).toISOString()
        const near = await this.connect()
        const masterAccount = await near.account(this.config.masterAccount)
        const toAccount = await near.account(to);

        const masterContract = this.getContract(masterAccount)

        const tokenAmount = new BN(amount).toNumber()

        const result = await masterContract.transfer({ to: toAccount.accountId, tokens: tokenAmount })
        if (!result) {
            throw new Error('Could not create transfer');
        }
        return {
            from: this.config.masterAccount,
            to: to,
            amount: amount,
            date: date,
            id: ''
        }
    }

    private getContract(signer: nearApi.Account): ElDoradoContract {
        return new nearApi.Contract(signer, this.config.contractName, {
            viewMethods: ['balanceOf', 'totalSupply', 'owner'],
            changeMethods: ['transfer', 'transferFrom', 'init', 'mint', 'approve'],
        }) as any as ElDoradoContract;
    }
}

type ElDoradoContract = {
    transfer(params: {
        to: string,
        tokens: number
    }): Promise<boolean>

    transferFrom(params: {
        from: string,
        to: string,
        tokens: number
    }): Promise<boolean>

    approve(params: {
        spender: string,
        tokens: number
    }): Promise<boolean>
}

export type NearConfig = {
    networkId: string
    nodeUrl: string
    walletUrl: string
    helperUrl: string
    masterAccount: string
    contractName: string
}

export type NearAccount = {
    accountId: string
    balance: string
    status: string
    identifier: string
    walletId: string
}

export type NearTransfer = {
    from: string
    to: string
    amount: string
    id: string
    date: string
}