import { Document, ObjectId } from 'mongodb';

/* Types */
type TSolicitationProgress = 'created' | 'accepted' | 'inProgress' | 'finished';

/* Enums */
export enum EColetaRole {
    user,
    employee,
    enterprise,
    admin
}

export enum EColetaType {
    rubble,
    recycle
}

/* Interfaces */
export interface IColetaAddress {
    cep: string,
    logradouro: string,
    complemento: string,
    unidade: string,
    bairro: string,
    localidade: string,
    uf: string,
    estado: string,
    regiao: string
}

export interface IColetaUser extends Document {
    _id?: ObjectId,
    id: number,
    email: string,
    verified: boolean,
    description: string,
    name: string,
    password: string,
    role: EColetaRole,
    addresses: IColetaAddress[],
    createdAt: number,
    rating: number,
    completedSolicitations?: number,
    cpf?: string,
    cnpj?: string
}

export interface IChat extends Document {
    _id?: ObjectId,
    id: number,
    owners: number[],
    data: IChatMessage[]
}

export interface IChatMessage {
    id: number,
    authorId: number,
    text: string,
    sentAt: number
}

export interface ISolicitation extends Document {
    _id?: ObjectId,
    id: number,
    authorId: number,
    employeeId?: number,
    accepted: boolean,
    progress: TSolicitationProgress,
    type: EColetaType,
    address: IColetaAddress,
    description: string,
    suggestedValue: number,
    consent: number[],
    finalValue?: number,
    createdAt: number,
    finishedAt?: number
}