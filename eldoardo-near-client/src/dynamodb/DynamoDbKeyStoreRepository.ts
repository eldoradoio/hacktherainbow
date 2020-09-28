import { IKeyStoreRepository, NearAccountData } from "../IKeyStoreRepository";
import * as AWS from "aws-sdk"

export class DynamoDbKeyStoreRepository implements IKeyStoreRepository {

    private tableName: string
    constructor() {
        // There is a legit reason why we dont validate the value here ;)
        this.tableName = process.env['DYNAMODB_KEY_STORE_TABLE_NAME'] || ''
    }
    

    private validateConfig() {
        if (!this.tableName) {
            throw new Error('environment variable DYNAMODB_KEY_STORE_TABLE_NAME is not set')
        }
    }
    
    async get(networkId: string, accountId: string): Promise<NearAccountData> {
        this.validateConfig();
        const db = new AWS.DynamoDB()
        const result = await db.getItem({
            Key: {
                "networkId": {
                    S: networkId
                },
                "accountId": {
                    S: accountId
                },
            },
            TableName: this.tableName,
            AttributesToGet: [
                'networkId',
                'accountId',
                'content'
            ],
            ConsistentRead: true
        }).promise()

        if (!result || !result.Item) {
            throw new Error(`Account "${accountId}" not found in network "${networkId}"`)
        }
        return this.toEntity(result.Item)

    }

    toEntity(attributes: AWS.DynamoDB.AttributeMap | undefined): NearAccountData | PromiseLike<NearAccountData> {
        const convert = AWS.DynamoDB.Converter.unmarshall
        if(!attributes){
            throw new Error('should not reach here')
        }
        const item = convert(attributes)
        return {
            accountId: item.accountId,
            networkId: item.networkId,
            content: item.content
        }
    }

    

    async save(account: NearAccountData): Promise<NearAccountData> {
        this.validateConfig();
        const db = new AWS.DynamoDB()
        // TODO: we should not override keypairs, losing a privatekey is BAD
        const result = await db.updateItem({
            Key: {
                "networkId": {
                    S: account.networkId
                },
                "accountId": {
                    S: account.accountId
                },
            },
            TableName: this.tableName,
            UpdateExpression: "set #content = :content",
            ExpressionAttributeNames: {
                "#content": "content",
            },
            ExpressionAttributeValues: {
                ":content": {
                    S: account.content
                },
            },
            ReturnValues: 'ALL_NEW'
        }).promise()
        
        return this.toEntity(result.Attributes)
    }

        
}