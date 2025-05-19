import { Request, Response } from 'express';
import { EColetaRole, IColetaUser } from './Database';

/* Types */
export type TMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'USE';

/* Interfaces */
export interface IController {
    main?: (request: IExpressRequest, response: IExpressResponse) => Promise<void>,
    path: string,
    method: TMethod,
    authenticationRequired: boolean,
    middlewares?: any[],
    requiredRole?: EColetaRole | EColetaRole[]
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