import { IKeyStoreRepository, NearAccountData } from "../IKeyStoreRepository";

export class DynamoDbKeyStoreRepository implements IKeyStoreRepository {
    get(): Promise<NearAccountData> {
        throw new Error("Method not implemented.");
    }
    save(account: NearAccountData): Promise<NearAccountData> {
        throw new Error("Method not implemented.");
    }
        
}