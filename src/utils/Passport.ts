import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { sign, verify } from 'jsonwebtoken';
import Logger from './Logger';
import { EColetaRole, IColetaUser } from '@datatypes/Database';
import { NextFunction, Request } from 'express';
import { IExpressResponse } from '@datatypes/Controllers';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { bold } from 'chalk';
import dotenv from 'dotenv';
import { getUserById, login } from './Database';

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

export const verifyTokenMiddleware = async (
    request: Request,
    response: IExpressResponse,
    next: NextFunction,
    requiredRole?: EColetaRole | EColetaRole[]
): Promise<void> => {
    const token = request.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        response.status(401).json({ message: 'No token provided' });
        return;
    }

    try {
        const tokenData = verify(token, saltKey) as IColetaUser;
        const user = await getUserById(tokenData.id);

        if (!user) {
            response.status(401).json({ message: 'User not found' });
            return;
        }
        
        const isArray = Array.isArray(requiredRole);
        if (!requiredRole || (!isArray && user.role == requiredRole) || (isArray && requiredRole.includes(user.role))) {
            request.user = user;
            next();
        }
        else response.status(403).json({ message: 'You don\'t have permission to access this endpoint' });
    } catch (error) {
        response.status(401).json({ message: 'Invalid token' });
    }
};