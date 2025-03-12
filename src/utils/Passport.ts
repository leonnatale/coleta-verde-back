import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { sign, verify } from 'jsonwebtoken';
import Logger from './Logger';
import { IColetaUser } from '@datatypes/Database';
import { NextFunction, Request, Response } from 'express';
import { IExpressResponse } from '@datatypes/Controllers';

const saltKey = process.env['SALT_KEY'] ?? 'salt';

if (saltKey === 'salt') Logger.warn('No salt key provided, using default: ' + saltKey);

const options: StrategyOptionsWithoutRequest = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: saltKey
}

export const jwtStrategy = new Strategy(options, async (payload, done) => {
    try {
        return done(null, payload);
    } catch (error) {
        return done(error);
    }
});

export function generateToken(user: IColetaUser): string {
    const token = sign(user, saltKey, { expiresIn: '1d' });
    return token;
}

export const verifyTokenMiddleware = (request: Request, response: IExpressResponse, next: NextFunction): void => {
    const token = request.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        response.status(401);
        return;
    }

    try {
        const user = verify(token, saltKey) as IColetaUser;
        request.user = user;
        next();
    } catch (error) {
        response.status(401);
    }
};
