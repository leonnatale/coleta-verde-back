import { Db, Document, FindCursor, MongoClient, OptionalId, WithId } from 'mongodb';
import Logger from './Logger';
import { bold } from 'chalk';

const mongoUri = process.env['MONGODB_URI_CONNECTION'] ?? 'mongodb://localhost:27017/';
const mongoDatabaseName = process.env['MONGODB_DATABASE_NAME'] ?? 'coletaverde';

let currentConnection: Db;

export async function openMongoConnection(): Promise<Db> {
    if (currentConnection) return currentConnection;
    const mongoClient = new MongoClient(mongoUri);
    const databaseConnection = await mongoClient.connect();
    const displayedUri = mongoUri.length > 20 ? `${mongoUri.substring(0, 20)}...` : mongoUri;
    Logger.log(`Connected to '${bold(displayedUri)}' at database '${bold(mongoDatabaseName)}'`);
    currentConnection = databaseConnection.db(mongoDatabaseName);
    return currentConnection;
}

export async function insertData<T extends OptionalId<Document>>(
    data: T,
    collectionName: string
): Promise<void> {
    currentConnection.collection(collectionName).insertOne(data);
}

export async function fetchData<T extends WithId<Document>>(
    collectionName: string,
    filter?: FindCursor<WithId<Document>>
): Promise<T[]> {
    return await currentConnection.collection(collectionName).find(filter ?? {}).toArray() as unknown as T[];
}