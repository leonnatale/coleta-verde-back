import { Db, Document, FindCursor, InsertOneResult, MongoClient, OptionalId, WithId } from 'mongodb';
import Logger from './Logger';
import { bold } from 'chalk';
import { IAuthLogin, IAuthRegister } from '@datatypes/Auth';
import { comparePassword, encryptPassword } from './Passport';
import { EColetaRole, IColetaUser } from '@datatypes/Database';

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

export function hideAttributes<T>(
    data: T,
    attributes: (keyof T)[]
): T {
    return Object.fromEntries(
        Object.entries(data as any).filter(([key]) => !attributes.includes(key as keyof T))
    ) as T;
}

export async function getUserById(id: number): Promise<IColetaUser | null> {
    const user = await currentConnection.collection<IColetaUser>('User').findOne({ id });
    return user;
}

async function getLastUserId(): Promise<number> {
    const lastUser = await currentConnection.collection('User').find().sort({ id: -1 }).limit(1).next();
    return lastUser ? (lastUser.id ?? 0) : 0;
}

async function getUserByName(name: string): Promise<IColetaUser | null> {
    const user = await currentConnection.collection<IColetaUser>('User').findOne({ name });
    return user;
}

export async function registerUser(data: IAuthRegister): Promise<IColetaUser | string> {
    const isValidName = /^\w+$/.test(data.name);
    if (!isValidName) return 'Invalid name';

    const existingUser = await getUserByName(data.name);
    if (existingUser) return 'User already exists';

    const isValidPassword = data.password.length >= 8 && data.password.length <= 20;
    if (!isValidPassword) return 'Password must be between 8 and 20 characters';

    const password = encryptPassword(data.password);
    const userData = {
        id: await getLastUserId() + 1,
        name: data.name,
        password,
        role: data.isEnterprise ? EColetaRole.enterprise : EColetaRole.user
    } as IColetaUser;

    await currentConnection.collection('User').insertOne(userData);
    
    return hideAttributes(userData, [ 'password' ]);
}

export async function login(data: IAuthLogin): Promise<IColetaUser | string> {
    const user = await getUserByName(data.name);
    if (!user) return 'User not found';

    const isValidPassword = comparePassword(data.password, user.password!);
    if (!isValidPassword) return 'Invalid password';

    return hideAttributes(user, [ 'password' ]);
}