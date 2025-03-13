import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { sign, verify } from 'jsonwebtoken';
import Logger from './Logger';
import { IColetaUser } from '@datatypes/Database';
import { NextFunction, Request } from 'express';
import { IExpressResponse } from '@datatypes/Controllers';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { bold } from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

const saltKey = process.env['SALT_KEY'] ?? 'salt';

if (saltKey === 'salt') Logger.warn('No salt key provided, using default.');

const bcryptRounds = parseInt(process.env['BCRYPT_ROUNDS'] ?? '10');
const bcryptSalt = genSaltSync(bcryptRounds);

Logger.log(`Using ${bold(bcryptRounds)} rounds for bcrypt.`);

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

export const encryptPassword = (value: string): string => hashSync(value, bcryptSalt);

export const comparePassword = (value: string, hash: string): boolean => compareSync(value, hash);

export const verifyTokenMiddleware = (request: Request, response: IExpressResponse, next: NextFunction): void => {
    const token = request.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        response.status(401).json({ message: 'No token provided' });
        return;
    }

    try {
        const user = verify(token, saltKey) as IColetaUser;
        request.user = user;
        next();
    } catch (error) {
        response.status(401).json({ message: 'Invalid token' });
    }
};