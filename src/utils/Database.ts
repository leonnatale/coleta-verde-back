import { Db, MongoClient, ObjectId } from 'mongodb';
import { bold } from 'chalk';
import Logger from './Logger';
import { IAuthLogin, IAuthRegister } from '@datatypes/Auth';
import { comparePassword, encryptPassword } from './Passport';
import { EColetaRole, IChat, IChatMessage, IColetaAddress, IColetaUser } from '@datatypes/Database';
import { IMessageData } from '@datatypes/Chat';

const mongoUri = process.env['MONGODB_URI_CONNECTION'] ?? 'mongodb://localhost:27017/';
const mongoDatabaseName = process.env['MONGODB_DATABASE_NAME'] ?? 'coletaverde';

let currentConnection: Db;

export const fetchMongoConnection = (): Db => currentConnection;

export async function openMongoConnection(): Promise<Db> {
    if (currentConnection) return currentConnection;
    const mongoClient = new MongoClient(mongoUri);
    const displayedUri = mongoUri.length > 20 ? `${mongoUri.substring(0, 20)}...` : mongoUri;
    Logger.log(`Connecting to '${bold(displayedUri)}' at database '${bold(mongoDatabaseName)}'`);
    const databaseConnection = await mongoClient.connect();
    Logger.log(`${bold.green('Successfully')} connected to the database.`);
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

function showRequiredFields<T extends object>(
    data: T,
    fields: (keyof T)[]
): string {
    const missingFields = fields.filter(field => !(field in data));
    if (missingFields.length === 0) return '';
    return `The following fields are required: ${missingFields.join(', ')}`;
}

const isValidEmail = (email: string): boolean => /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email);
const isValidCNPJ = (cnpj: string): boolean => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj);

export async function getUserById(id: number): Promise<IColetaUser | null> {
    const user = await currentConnection.collection<IColetaUser>('User').findOne({ id });
    return user;
}

async function getLastUserId(): Promise<number> {
    const lastUser = await currentConnection.collection<IColetaUser>('User').find().sort({ id: -1 }).limit(1).next();
    return lastUser ? (lastUser.id ?? 0) : 0;
}

async function getUserByEmail(email: string): Promise<IColetaUser | null> {
    const user = await currentConnection.collection<IColetaUser>('User').findOne({ email });
    return user;
}

async function getUserByCNPJ(cnpj: string): Promise<IColetaUser | null> {
    const user = await currentConnection.collection<IColetaUser>('User').findOne({ cnpj });
    return user;
}

export async function getUserByObjectId(objectId: string): Promise<IColetaUser | null> {
    const user = await currentConnection.collection<IColetaUser>('User').findOne({ _id: new ObjectId(objectId) });
    return user;
}

export async function registerUser(data: IAuthRegister): Promise<IColetaUser | string> {
    const requiredFields = showRequiredFields<IAuthRegister>(data, [ 'email', 'name', 'password', 'accountType' ]);
    if (requiredFields) return requiredFields;

    if (!isValidEmail(data.email)) return 'Invalid email';

    const existingUserEmail = await getUserByEmail(data.email);
    if (existingUserEmail) return 'Email already in use';

    const nameLimit = {
        min: 3,
        max: 50
    };

    const isValidName = data.name.length >= nameLimit.min && data.name.length <= nameLimit.max;
    if (!isValidName) return `Name must be between ${nameLimit.min} and ${nameLimit.max} characters`;

    const passwordLimit = {
        min: 8,
        max: 20
    };

    const isValidPassword = data.password.length >= passwordLimit.min && data.password.length <= passwordLimit.max;
    if (!isValidPassword) return `Password must be between ${passwordLimit.min} and ${passwordLimit.max} characters`;

    const password = encryptPassword(data.password);

    const roles = {
        user: EColetaRole.user,
        employee: EColetaRole.employee,
        enterprise: EColetaRole.enterprise
    };

    if (!(data.accountType in roles)) return `Invalid account type (Available types: ${Object.keys(roles)})`;

    if (data.accountType === 'enterprise') {
        if (!data.cnpj) return 'CNPJ is required for enterprises';
        if (!isValidCNPJ(data.cnpj)) return 'Invalid CNPJ';

        const existingUserCNPJ = await getUserByCNPJ(data.cnpj);
        if (existingUserCNPJ) return 'CNPJ already in use';
    }

    const userData: IColetaUser = {
        id: (await getLastUserId()) + 1,
        email: data.email,
        verified: false,
        name: data.name,
        description: '',
        password,
        role: roles[data.accountType],
        addresses: [],
        createdAt: Date.now()
    };

    if (data.accountType === 'enterprise') userData.cnpj = data.cnpj;

    await currentConnection.collection('User').insertOne(userData);
    
    return hideAttributes(userData, [ 'password', '_id' ]);
}

export async function verifyEmail(objectId: string): Promise<IColetaUser | null> {
    const user = await getUserByObjectId(objectId);
    if (!user) return null;
    if (user.verified) return null;

    await currentConnection.collection('User').updateOne({ _id: new ObjectId(objectId) }, { $set: { verified: true } });

    return hideAttributes(user, [ 'password', '_id' ]);
}

export async function login(data: IAuthLogin): Promise<IColetaUser | string> {
    const requiredFields = showRequiredFields<IAuthLogin>(data, [ 'email', 'password' ]);
    if (requiredFields) return requiredFields;

    if (!isValidEmail(data.email)) return 'Invalid email';

    const user = await getUserByEmail(data.email);
    if (!user) return 'User not found';

    const isValidPassword = comparePassword(data.password, user.password);
    if (!isValidPassword) return 'Invalid password';

    return hideAttributes(user, [ 'password' ]);
}

async function getLasChatId(): Promise<number> {
    const lastChat = await currentConnection.collection<IColetaUser>('Chat').find().sort({ id: -1 }).limit(1).next();
    return lastChat ? (lastChat.id ?? 0) : 0;
}

export async function createChat(
    from: number,
    to: number
): Promise<IChat> {
    const chat: IChat = {
        id: (await getLasChatId()) + 1,
        owners: [ from, to ],
        data: []
    };

    await currentConnection.collection<IChat>('Chat').insertOne(chat);

    return chat;
}

export async function getChatIdFromOwners(
    from: number,
    to: number
): Promise<number | null> {
    const chat = await currentConnection.collection<IChat>('Chat').findOne({
        $where() {
            return from in this.owners && to in this.owners;
        }
    });

    return chat?.id ?? null;
}

export async function getLastMessageIdFromChat(chatId: number): Promise<number> {
    const chat = await currentConnection.collection<IChat>('Chat').findOne({ id: chatId });
    return chat?.data.length ?? 0;
}

export async function getMessagesFromChat(chatId: number): Promise<IChatMessage[] | null> {
    const chat = await currentConnection.collection<IChat>('Chat').findOne({ id: chatId });
    return chat ? chat.data : null;
}


export async function sendMessage(data: IMessageData): Promise<string | IChatMessage> {
    const requiredFields = showRequiredFields(data, [ 'to', 'message' ]);
    if (requiredFields) return requiredFields;

    if (data.from == data.to) return 'Can\'t message to yourself';

    const userExist = await getUserById(data.to);

    if (!userExist) return 'User not found';

    const chatId = await getChatIdFromOwners(data.from, data.to) ?? (await createChat(data.from, data.to)).id;

    if (!chatId) return 'Couldn\'t find or create the chat.';

    const message: IChatMessage = {
        id: (await getLastMessageIdFromChat(chatId)) + 1,
        authorId: data.from,
        text: data.message,
        sentAt: Date.now()
    };
    
    await currentConnection.collection<IChat>('Chat').updateOne(
        { id: chatId },
        { $push: { data: message as any } }
    );

    return message;
}