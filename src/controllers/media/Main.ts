import { IController } from '@datatypes/Controllers';
import express from 'express';

export const controller: IController = {
    path: '/',
    method: 'USE',
    authenticationRequired: false,
    middlewares: [ express.static('/uploads/') ]
}