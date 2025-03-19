import { Document, ObjectId } from 'mongodb';

/* Interfaces */

export interface IChatMessage extends Document {
    _id: ObjectId,
    userId: number,
    text: string,
    sentAt: number
}