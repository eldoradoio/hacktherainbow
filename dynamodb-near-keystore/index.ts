import * as nearApi from 'near-api-js/lib';
import BN from 'bn.js';
import { KeyStore } from "near-api-js/lib/key_stores";
import { INearAccounts } from './INearAccounts'

export class NearAccounts implements INearAccounts {
   
    private keyStore: KeyStore
    private config: NearConfig;

    constructor(config: NearConfig, keyStore: KeyStore) {
        
        this.keyStore =keyStore
        this.config = config
    }


    private async connect(): Promise<nearApi.Near> {
        return await nearApi.connect({
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

        const amount = new BN("16552803572267293929962")
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

        return {
            accountId: accountId,
            balance: '0',
            status: 'created',
            identifier: identifier,
            walletId: accountId
        }
    }
}


type NearConfig = {
    networkId: string
    nodeUrl: string
    walletUrl: string
    helperUrl: string
    masterAccount: string
}

export type NearAccount = {
    accountId: string
    balance: string
    status: string
    identifier: string
    walletId: string
}