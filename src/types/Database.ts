import { Document } from 'mongodb';

/* Enums */
export enum EColetaRole {
    user,
    enterprise,
    employee,
    admin
}

/* Interfaces */
export interface IColetaUser extends Document {
    id: number,
    name: string,
    password?: string,
    role: EColetaRole
}