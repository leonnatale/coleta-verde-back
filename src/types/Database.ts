import { Document, ObjectId } from 'mongodb';

/* Enums */
export enum EColetaRole {
    user,
    employee,
    enterprise,
    admin
}

/* Interfaces */
export interface IColetaAddress {
    cep: string,
    number: string,
    complement: string
}

export interface IColetaUser extends Document {
    _id: ObjectId,
    id: number,
    email: string,
    verified: boolean,
    description: string,
    name: string,
    password: string,
    role: EColetaRole,
    addresses: IColetaAddress[],
    createdAt: number,
    cnpj?: string
}