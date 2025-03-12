import { Request, Response } from 'express';
import { IColetaUser } from './Database';

/* Types */
type TMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/* Interfaces */
export interface IController {
    main: (request: IExpressRequest, response: IExpressResponse) => Promise<void>,
    path: string,
    method: TMethod,
    authenticationRequired: boolean
}

export interface IResponse<T> {
    status?: number,
    message?: string,
    data?: T
}

export interface IExpressResponse extends Response {
    json: <T>(response: IResponse<T>) => this,
    status: (status: number) => this
}

export interface IExpressRequest extends Request {
    user?: IColetaUser
}