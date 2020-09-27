import * as nearApi from 'near-api-js/lib';
import BN from 'bn.js';
import { KeyStore } from "near-api-js/lib/key_stores";
import { INearAccounts } from './INearAccounts'
import { Signature } from 'near-api-js/lib/transaction';
import { ExecutionStatus, FinalExecutionOutcome } from 'near-api-js/lib/providers/provider';

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

    public async getWallet(accountId: string): Promise<NearAccount | undefined> {
        const near = await this.connect()
        const account = await near.account(accountId);
        if (!account) {
            throw new Error(`Sorry, account '${accountId}' does not exists.`);
        }
        const contract = this.getContract(account)
        const balance = await contract.balanceOf({ tokenOwner: account.accountId })
        return {
            accountId: account.accountId,
            balance: new BN(balance).toString(),
            status: 'created',
            walletId: account.accountId
        }
    }

    public async createWallet(accountId: string): Promise<NearAccount> {
        const near = await this.connect()

        const mainAccount = new nearApi.Account(near.connection, this.config.masterAccount);

        const approveAmount = new BN("4231039307375954236152")
        const createAccountAmount = new BN("16552803572267293929962")
        const noIdeaWhy = new BN("2991510480986748")
        const amount = createAccountAmount.add(approveAmount).add(noIdeaWhy)

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

        // TODO: Use signAndSendTransaction instead of doing approve here

        const approved = await senderContract.approve({
            spender: mainAccount.accountId,
            tokens: 1000000 // one million preapproved kek
        })

        return {
            accountId: accountId,
            balance: '0',
            status: 'created',
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

        const args = { from: fromAccount.accountId, to: toAccount.accountId, tokens: tokenAmount }
        // const result = await masterContract.transferFrom(args)
        // if (!result) {
        //     throw new Error('Could not create transfer');
        // }

        const networkStatus = await near.connection.provider.status();
        const recentBlock = networkStatus.sync_info.latest_block_hash;
        const blockHash = nearApi.utils.serialize.base_decode(recentBlock);

        const response = await near.connection.provider.query(`access_key/${masterAccount.accountId}`, '');
        const keypair = await this.keyStore.getKey(this.config.networkId, masterAccount.accountId)
        const publickey = keypair.getPublicKey();
        const key = response.keys.filter((k: any) => k.public_key === publickey.toString())[0];
        console.assert(key.access_key.permission === 'FullAccess');
        const nonce = key.access_key.nonce + 1; // will increment with each use of the key

        const actions = [
            // masterAccount.functionCall(this.config.contractName, 'transferFrom', args)
            // nearApi.transactions.transfer(new BN(1))
            nearApi.transactions.functionCall('transferFrom', args, new BN(8000000000000), new BN(0))
        ];

        const transaction = nearApi.transactions.createTransaction(masterAccount.accountId, publickey, masterAccount.accountId, nonce, actions, blockHash);
        // const bytes = transaction.encode();

        // const signedMsg = await near.connection.signer.signMessage(bytes, masterAccount.accountId, this.config.networkId);

        // WARNING: this line won't work bc Signature is not exported by near-api-js
        // const signedTx = new nearApi.transactions.SignedTransaction({ transaction, signature: new Signature(signedMsg.signature) });
        const [bt, signedTx] = await nearApi.transactions.signTransaction(transaction, near.connection.signer, masterAccount.accountId, this.config.networkId)


        let receipt = await near.connection.provider.sendTransaction(signedTx);
        let result: boolean = false;
        if (receipt.status) {
            const status = receipt.status as ExecutionStatus
            if (status.Failure) {
                if (status.Failure.error_message) {
                    throw new Error(status.Failure.error_message);
                } else {
                    throw new Error(JSON.stringify(status.Failure));
                }
            } else if (status.SuccessValue) {

                result = this.atobtojson(status.SuccessValue)
                if (result === true) {
                    result = true
                } else {
                    result = false
                }
            }
            else {
                result = false;
            }
        }

        const receiptId = receipt.transaction_outcome.outcome.receipt_ids[0]
        const txHash = receipt.transaction_outcome.id

        return {
            from: from,
            to: to,
            amount: amount,
            date: date, // find tx date
            id: txHash,
            status: TransferStatus.Sent
        }
    }


    public async getTransfer(txHash: string): Promise<NearTransfer | undefined> {

        const near = await this.connect()
        const txHashBytes = nearApi.utils.serialize.base_decode(txHash)
        const status = await near.connection.provider.txStatus(txHashBytes, this.config.contractName);
        const outcome: any = status.transaction_outcome
        const date = (await near.connection.provider.block(outcome.block_hash)).header.timestamp / 1000000

        const actions = (status.transaction.actions as Array<any>) || []
        if (actions && actions.length > 0) {
            const transferFromAction = actions.find(x => x.FunctionCall.method_name === "transferFrom")
            if (transferFromAction) {
                const transferFromArgs = this.atobtojson(transferFromAction.FunctionCall.args)
                return {
                    from: transferFromArgs.from,
                    to: transferFromArgs.to,
                    amount: transferFromArgs.tokens.toString(),
                    id: txHash,
                    status: TransferStatus.Final,
                    date: new Date(date).toISOString() // find tx date
                }
            }
        }
        return;
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
            id: '', // TODO pass hash
            status: TransferStatus.Sent
        }
    }

    private getContract(signer: nearApi.Account): ElDoradoContract {
        return new nearApi.Contract(signer, this.config.contractName, {
            viewMethods: ['balanceOf', 'totalSupply', 'owner'],
            changeMethods: ['transfer', 'transferFrom', 'init', 'mint', 'approve'],
        }) as any as ElDoradoContract;
    }

    private atobtojson(result: any) {
        if (typeof result === 'string') {
            const value = Buffer.from(result, 'base64').toString();
            try {
                return JSON.parse(value);
            }
            catch (e) {
                return value;
            }
        }
        return null;
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

    balanceOf(params: { tokenOwner: string }): Promise<number>
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
    walletId: string
}

export type NearTransfer = {
    from: string
    to: string
    amount: string
    id: string
    date: string
    status: TransferStatus
}

export enum TransferStatus {
    Sent,
    Final,
    Error
}