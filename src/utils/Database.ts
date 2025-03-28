import { Db, MongoClient, ObjectId } from 'mongodb';
import { bold } from 'chalk';
import Logger from './Logger';
import { IAuthLogin, IAuthRegister } from '@datatypes/Auth';
import { comparePassword, encryptPassword } from './Passport';
import { EColetaRole, EColetaType, IChat, IChatMessage, IColetaUser, ISolicitation } from '@datatypes/Database';
import { IMessageData } from '@datatypes/Chat';
import { ISolicitationCreation } from '@datatypes/Solicitation';

const mongoUri = process.env['MONGODB_URI_CONNECTION'] ?? 'mongodb://localhost:27017/';
const mongoDatabaseName = process.env['MONGODB_DATABASE_NAME'] ?? 'coletaverde';

let currentConnection: Db;

export const fetchMongoConnection = (): Db => currentConnection;

const nameLimit = {
    min: 3,
    max: 50
};

const passwordLimit = {
    min: 8,
    max: 20
};

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
const isValidCPF = (cpf: string): boolean => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);

/* User */
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

async function getUserByCPF(cpf: string): Promise<IColetaUser | null> {
    const user = await currentConnection.collection<IColetaUser>('User').findOne({ cpf });
    return user;
}

export async function getUserByObjectId(objectId: string): Promise<IColetaUser | null> {
    const user = await currentConnection.collection<IColetaUser>('User').findOne({ _id: new ObjectId(objectId) });
    return user;
}

export async function updateUserData(id: number, data: Partial<IColetaUser>): Promise<IColetaUser | null> {
    const user = await getUserById(id);
    if (!user) return null;

    if (data.password) {
        const isValidPassword = data.password.length >= passwordLimit.min && data.password.length <= passwordLimit.max;
        if (!isValidPassword) return null;

        data.password = encryptPassword(data.password);
    }

    if (data.name) {
        const isValidName = data.name.length >= nameLimit.min && data.name.length <= nameLimit.max;
        if (!isValidName) return null;
    }

    await currentConnection.collection('User').updateOne({ id }, { $set: data });

    return user;
}

export async function registerUser(data: IAuthRegister): Promise<IColetaUser | string> {
    const requiredFields = showRequiredFields<IAuthRegister>(data, ['email', 'name', 'password', 'accountType']);
    if (requiredFields) return requiredFields;

    if (!isValidEmail(data.email)) return 'Invalid email';

    const existingUserEmail = await getUserByEmail(data.email);
    if (existingUserEmail) return 'Email already in use';

    const isValidName = data.name.length >= nameLimit.min && data.name.length <= nameLimit.max;
    if (!isValidName) return `Name must be between ${nameLimit.min} and ${nameLimit.max} characters`;

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
    } else {
        if (!data.cpf) return 'CPF is required for users and employees';
        if (!isValidCPF(data.cpf)) return 'Invalid CPF';

        const existingUserCPF = await getUserByCPF(data.cpf);
        if (existingUserCPF) return 'CPF already in use';
    }

    const userData: IColetaUser = {
        id: (await getLastUserId()) + 1,
        email: data.email,
        verified: false,
        name: data.name,
        description: '',
        password,
        role: roles[data.accountType],
        rating: 0,
        addresses: [],
        createdAt: Date.now()
    };

    if (data.accountType === 'enterprise') userData.cnpj = data.cnpj;
    else if (data.accountType === 'employee') userData.completedSolicitations = 0;

    if (data.accountType !== 'enterprise') userData.cpf = data.cpf;

    await currentConnection.collection('User').insertOne(userData);

    return hideAttributes(userData, ['password', '_id']);
}

export async function verifyEmail(objectId: string): Promise<IColetaUser | null> {
    const user = await getUserByObjectId(objectId);
    if (!user) return null;
    if (user.verified) return null;

    await currentConnection.collection('User').updateOne({ _id: new ObjectId(objectId) }, { $set: { verified: true } });

    return hideAttributes(user, ['password', '_id']);
}

export async function login(data: IAuthLogin): Promise<IColetaUser | string> {
    const requiredFields = showRequiredFields<IAuthLogin>(data, ['email', 'password']);
    if (requiredFields) return requiredFields;

    if (!isValidEmail(data.email)) return 'Invalid email';

    const user = await getUserByEmail(data.email);
    if (!user) return 'User not found';

    const isValidPassword = comparePassword(data.password, user.password);
    if (!isValidPassword) return 'Invalid password';

    return hideAttributes(user, ['password']);
}

/* End user */

/* Chat */
async function getLastChatId(): Promise<number> {
    const lastChat = await currentConnection.collection<IColetaUser>('Chat').find().sort({ id: -1 }).limit(1).next();
    return lastChat ? (lastChat.id ?? 0) : 0;
}

export async function createChat(
    from: number,
    to: number
): Promise<IChat> {
    const chat: IChat = {
        id: (await getLastChatId()) + 1,
        owners: [from, to],
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
    const requiredFields = showRequiredFields(data, ['to', 'message']);
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

/* End chat */

/* Address */
export async function createAddress() { }
/* End address */

/* Solicitation */

async function getLastSolicitationId(): Promise<number> {
    const lastChat = await currentConnection.collection<IColetaUser>('Chat').find().sort({ id: -1 }).limit(1).next();
    return lastChat ? (lastChat.id ?? 0) : 0;
}
export async function createSolicitation(data: ISolicitationCreation): Promise<ISolicitation | string> {
    const missingFields = showRequiredFields(data, ['type', 'addressIndex', 'description', 'suggestedValue']);
    if (missingFields) return missingFields;

    const author: IColetaUser = (await getUserById(data.authorId))!;

    const types = {
        rubble: EColetaType.rubble,
        recycle: EColetaType.recycle
    };

    const type = types[data.type];

    if (type === undefined) return `Invalid type, avaible types: ${Object.keys(types).join(', ')}`;

    const address = author.addresses[data.addressIndex];

    if (!address) return 'Invalid address index';

    if (data.description.length > 3_000) return 'Description field exceeded the max characters limit';

    if (isNaN(data.suggestedValue) || typeof data.suggestedValue !== 'number') return 'Suggested value is not a number';
    if (data.suggestedValue <= 0) return 'Suggested value must be greater than 0.';

    const suggestedValue = parseFloat(data.suggestedValue.toFixed(2));

    const solicitation: ISolicitation = {
        id: (await getLastSolicitationId()) + 1,
        authorId: data.authorId,
        type,
        address,
        description: data.description,
        suggestedValue,
        accepted: false,
        createdAt: Date.now()
    };

    await currentConnection.collection<ISolicitation>('Solicitation').insertOne(solicitation);

    return solicitation;
}
/* End solicitation */