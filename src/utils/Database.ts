import { IColetaUser } from '@types/Database';
import { Db, MongoClient } from 'mongodb';

const mongoUrl = process.env['MONGODB_URL_CONNECTION'] ?? 'mongodb://localhost:27017/';

let currentConnection: Db;

export async function openMongoConnection(): Promise<Db> {
    if (currentConnection) return currentConnection;
    const mongoClient = new MongoClient(mongoUrl);
    const databaseConnection = await mongoClient.connect();
    return currentConnection = databaseConnection.db('coletaverde');
}

export async function testGet(): Promise<any[]> {
    return currentConnection.collection('Main').find({}).toArray();
}