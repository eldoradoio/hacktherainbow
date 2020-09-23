
import { KeyPair } from "near-api-js/lib/";
import { KeyStore } from "near-api-js/lib/key_stores";
import { IKeyStoreRepository } from "./IKeyStoreRepository";

/**
 * Format of the account stored on disk.
 */
export interface AccountInfo {
    account_id: string;
    public_key: string;
    private_key: string;
}

export class DynamoDbKeyStore extends KeyStore {
    private readonly keyStoreRepo: IKeyStoreRepository

    constructor(keyStoreRepo: IKeyStoreRepository) {
        super();
        this.keyStoreRepo = keyStoreRepo
    }

    /**
     * Sets a storage item in a file, unencrypted
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @param accountId The NEAR account tied to the key pair
     * @param keyPair The key pair to store in local storage
     */
    async setKey(networkId: string, accountId: string, keyPair: KeyPair): Promise<void> {
       
        const content: AccountInfo = { account_id: accountId, public_key: keyPair.getPublicKey().toString(), private_key: keyPair.toString() };
        //networkId
        //accountId
        await this.keyStoreRepo.save({
            accountId: accountId,
            networkId: networkId,
            content: JSON.stringify(content)
        });
    }

    /**
     * Gets a key from local storage
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @param accountId The NEAR account tied to the key pair
     * @returns {Promise<KeyPair>}
     */
    async getKey(networkId: string, accountId: string): Promise<KeyPair> {
        const data = await this.keyStoreRepo.get(networkId, accountId)
        const info: AccountInfo = JSON.parse(data.content)
        return KeyPair.fromString(info.private_key)
    }

    /**
     * Removes a key from local storage
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @param accountId The NEAR account tied to the key pair
     */
    async removeKey(networkId: string, accountId: string): Promise<void> {
        throw 'this is a no op'
    }

    /**
     * Removes all items from local storage
     */
    async clear(): Promise<void> {
        throw 'this is a no op'
    }

    /**
     * Get the network(s) from local storage
     * @returns {Promise<string[]>}
     */
    async getNetworks(): Promise<string[]> {
        throw 'Not implemented' 
    }

    /**
     * Gets the account(s) from local storage
     * @param networkId The targeted network. (ex. default, betanet, etc…)
     * @returns{Promise<string[]>}
     */
    async getAccounts(networkId: string): Promise<string[]> {
        throw 'this is a no op'
    }
}