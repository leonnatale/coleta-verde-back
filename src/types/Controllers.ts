import { Request, Response } from "express";
import { IColetaUser } from "./Database";

/* Types */
type TMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/* Interfaces */
export interface IController {
    main: (request: Request, response: Response, currentUser?: IColetaUser) => Promise<void>,
    path: string,
    method: TMethod,
    authorizationRequired: boolean
}