import { Db, MongoClient, ObjectId } from 'mongodb';
import { bold } from 'chalk';
import Logger from './Logger';
import { IAuthLogin, IAuthRegister } from '@datatypes/Auth';
import { comparePassword, encryptPassword } from './Passport';
import { EColetaRole, EColetaType, IChat, IChatMessage, IColetaAddress, IColetaUser, ISolicitation } from '@datatypes/Database';
import { IMessageData } from '@datatypes/Chat';
import { ISolicitationAccept, ISolicitationConsentFinalValue, ISolicitationCreation, ISolicitationSuggestNewValue } from '@datatypes/Solicitation';
import { IAddressCreation } from '@datatypes/Address';
import { getAddressFromCEP } from './ViaCEP';

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
const isValidCEP = (cep: string): boolean => /^\d{5}-\d{3}$/.test(cep);

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
        $and: [{ owners: from }, { owners: to }]
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
export async function alreadyHasRegisteredAddress(userId: number, cep: string, unidade?: string): Promise<boolean> {
    const user = await getUserById(userId);
    if (!user) return false;
    return user.addresses.some(address => address.cep == cep && address.unidade == unidade || !address.unidade && !unidade);
}

export async function createAddress(data: IAddressCreation, userId: number): Promise<IColetaAddress | string> {
    const missingFields = showRequiredFields(data, ['cep']);
    if (missingFields) return missingFields;

    if (data.unidade && typeof data.unidade !== 'string') return 'Invalid unidade type.';

    if (!isValidCEP(data.cep)) return 'Invalid CEP.';

    const addressData = await getAddressFromCEP(data.cep);

    if (!addressData) return 'Doesn\'t exist addresses with this CEP.';

    const user = await getUserById(userId);
    if (!user) return 'User not found.';

    if (await alreadyHasRegisteredAddress(userId, data.cep, data.unidade)) return 'This address is already registered.';

    const newAddress: IColetaAddress = {
        ...addressData,
        complemento: data.complemento || addressData.complemento || '',
        unidade: data.unidade || addressData.unidade || '',
        cep: data.cep
    };

    await currentConnection.collection<IColetaUser>('User').updateOne(
        { id: userId },
        { $push: { addresses: newAddress as any } }
    );

    return newAddress;
}

export async function deleteAddress(userId: number, index: number): Promise<IColetaAddress | string> {
    const user = await getUserById(userId);
    if (!user) return 'User not found.';

    if (index < 0 || index >= user.addresses.length) return 'Invalid address index.';

    const address = user.addresses[index];

    if (!address) return 'Address not found.';

    await currentConnection.collection<IColetaUser>('User').updateOne(
        { id: userId },
        { $pull: { addresses: address as any } }
    );

    return address;
}
/* End address */

/* Solicitation */

async function getLastSolicitationId(): Promise<number> {
    const lastChat = await currentConnection.collection<IColetaUser>('Solicitation').find().sort({ id: -1 }).limit(1).next();
    return lastChat ? (lastChat.id ?? 0) : 0;
}

export async function getSolicitationById(id: number): Promise<ISolicitation | null> {
    const solicitation = await currentConnection.collection<ISolicitation>('Solicitation').findOne({ id });
    return solicitation;
}

export async function getSolicitationByAddress(cep: string, unidade: string): Promise<ISolicitation | null> {
    const solicitation = await currentConnection.collection<ISolicitation>('Solicitation')
        .findOne({
            'address.cep': cep,
            'address.unidade': unidade
        });
    return solicitation;
}

export async function cancelSolicitation(id: number) {
    return currentConnection.collection<ISolicitation>('Solicitation').updateOne({ id }, { $set: { progress: 'cancelled' } })
}

export async function terminateExpiredSolicitation() {
    const result = await currentConnection.collection<ISolicitation>('Solicitation').updateMany({ expiration: { $lt: Date.now() } }, { $set: { progress: 'expired' } })
}

export async function createSolicitation(data: ISolicitationCreation, file?: Express.Multer.File): Promise<ISolicitation | string> {
    const missingFields = showRequiredFields(data, ['type', 'addressIndex', 'description', 'desiredDate', 'suggestedValue']);
    if (missingFields) return missingFields;

    const desiredDate = new Date(data.desiredDate).getTime();
    if (Date.now() > desiredDate) return 'We don\'t live in the past!';

    const author: IColetaUser = (await getUserById(data.authorId))!;
    
    const types = {
        rubble: EColetaType.rubble,
        recycle: EColetaType.recycle,
        organic: EColetaType.organic,
        biohazard: EColetaType.biohazard,
        eletronic: EColetaType.eletronic,
        other: EColetaType.other
    };
    
    const type = types[data.type];
    
    if (type === undefined) return `Invalid type, avaible types: ${Object.keys(types).join(', ')}`;
    
    const address = author.addresses[data.addressIndex];
    
    if (!address) return 'Invalid address index';
    
    const solicitationData = await getSolicitationByAddress(address.cep, address.unidade); 
    if (solicitationData) if (solicitationData.address.unidade == address.unidade || !([ 'expired', 'cancelled', 'finished' ].includes(solicitationData.progress))) return 'A solicitation already exists for this same address.';

    if (data.description.length > 3_000) return 'Description field exceeded the max characters limit';

    if (isNaN(data.suggestedValue) || typeof data.suggestedValue !== 'number') return 'Suggested value is not a number';
    if (data.suggestedValue <= 0) return 'Suggested value must be greater than 0.';

    const suggestedValue = parseFloat(data.suggestedValue.toFixed(2));
    const now = Date.now();
    const expiration = new Date(now);
    expiration.setDate(expiration.getDate() + 1);

    const solicitation: ISolicitation = {
        id: (await getLastSolicitationId()) + 1,
        authorId: data.authorId,
        progress: 'created',
        type,
        address,
        description: data.description,
        suggestedValue,
        accepted: false,
        consent: [],
        desiredDate: data.desiredDate,
        expiration: expiration.getTime(),
        createdAt: now
    };

    if (file) solicitation.image = file.filename.replace(/\\/g, '/');

    await currentConnection.collection<ISolicitation>('Solicitation').insertOne(solicitation);

    return solicitation;
}

export async function suggestNewValue(data: ISolicitationSuggestNewValue): Promise<string | null> {
    if (isNaN(data.value) || typeof data.value !== 'number') return 'Final value is not a number';
    if (data.value <= 0) return 'Final value must be greater than 0.';

    const solicitation = await getSolicitationById(data.id);
    if (!solicitation) return 'Solicitation not found.';

    if (solicitation.authorId !== data.authorId && solicitation.employeeId !== data.authorId) return 'You\'re not allowed';
    
    if (solicitation.progress != 'accepted') return 'Can\'t suggest a new value';

    const newValue = parseFloat(data.value.toFixed(2));

    await currentConnection.collection<ISolicitation>('Solicitation').updateOne(
        { id: data.id },
        { $set: { suggestedValue: newValue, consent: [] } }
    );

    return null;
}

export async function consentFinalValue(data: ISolicitationConsentFinalValue): Promise<ISolicitation | string> {
    let solicitation = await getSolicitationById(data.id);
    if (!solicitation) return 'Solicitation not found.';

    if (solicitation.finalValue != undefined) return 'Final value is already defined';

    if (!solicitation.accepted) return 'Solicitation is not accepted';

    if (solicitation.employeeId !== data.authorId && solicitation.authorId !== data.authorId) return 'You\'re not allowed.';

    if (solicitation.consent.includes(data.authorId)) return 'You\'ve already consented.';

    await currentConnection.collection<ISolicitation>('Solicitation').updateOne(
        { id: data.id },
        { $push: { consent: data.authorId as any } }
    );

    solicitation = (await getSolicitationById(data.id))!;

    if (solicitation.consent.includes(solicitation.authorId) && solicitation.consent.includes(solicitation.employeeId!))
        await currentConnection.collection<ISolicitation>('Solicitation').updateOne(
            { id: data.id },
            { $set: { finalValue: solicitation.suggestedValue } }
        );

    return solicitation;
}

export async function acceptSolicitation(data: ISolicitationAccept): Promise<ISolicitation | string> {
    const solicitation = await getSolicitationById(data.id);
    if (!solicitation) return 'Solicitation not found.';

    if (solicitation.accepted || solicitation.progress != 'created') return 'This solicitation couldn\'t be accepted';

    if (solicitation.authorId == data.employeeId) return 'You can\'t accept solicitations created by yourself';

    await currentConnection.collection<ISolicitation>('Solicitation').updateOne(
        { id: data.id },
        { $set: { accepted: true, employeeId: data.employeeId } }
    );

    return solicitation;
}

export async function listAllSolicitations(page: number, limit: number = 5): Promise<ISolicitation[]> {
    const solicitations = await currentConnection.collection<ISolicitation>('Solicitation')
    .find({}, { projection: { _id: 0 } })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();
    return solicitations;
}

export async function listMySolicitations(authorId: number, page: number, limit: number = 5): Promise<ISolicitation[]> {
    const solicitations = await currentConnection.collection<ISolicitation>('Solicitation')
    .find({ authorId }, { projection: { _id: 0 } })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();
    return solicitations;
}

/* End solicitation */