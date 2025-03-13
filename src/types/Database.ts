import { Document, ObjectId } from 'mongodb';

/* Enums */
export enum EColetaRole {
    user,
    enterprise,
    employee,
    admin
}

/* Interfaces */
export interface IColetaUser extends Document {
    _id: ObjectId,
    id: number,
    name: string,
    password?: string,
    role: EColetaRole
}