import { IController } from '@datatypes/Controllers';
import express from 'express';
import path from 'path';

export const controller: IController = {
    path: '/',
    method: 'USE',
    authenticationRequired: false,
    middlewares: [ express.static(path.join(process.cwd(), 'uploads')) ]
}