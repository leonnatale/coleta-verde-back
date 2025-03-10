import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

config();

let currentConnection: MongoClient;

export async function connect(): Promise<MongoClient> {
    if (currentConnection) return currentConnection;

    currentConnection = new MongoClient();
}