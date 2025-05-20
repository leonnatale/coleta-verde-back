import { IController, IExpressResponse, IResponse } from '@datatypes/Controllers';
import { jwtStrategy, rateLimitMiddleware, verifyTokenMiddleware } from '@utils/Passport';
import Logger from '@utils/Logger';
import { openMongoConnection, terminateExpiredSolicitation } from '@utils/Database';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { bold } from 'chalk';
import { readdirSync } from 'fs';
import path from 'path';
import { initializeMailer } from '@utils/Mailer';
import cors from 'cors';

dotenv.config();
const port = parseInt(process.env['PORT'] ?? '8080');
const app = express();

process.on('uncaughtException', (error, origin) => console.log(error, origin));

passport.use(jwtStrategy);
app.use(passport.initialize());
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(rateLimitMiddleware);

const responseMiddleware = (_request: Request, response: Response, next: NextFunction) => {
    const self = response;
    const sendJson = response.json;
    const sendStatus = response.status;
    response.json = <T>(data: IResponse<T>) => {
        data.status = response.statusCode;
        return sendJson.call(self, data);
    }

    response.status = (statusCode: number) => {
        return sendStatus.call(self, statusCode);
    }

    next();
}

const controllers = readdirSync(path.join(__dirname, 'controllers'));
const methodColor = {
    GET: 'green',
    POST: 'purple',
    PUT: 'orange',
    DELETE: 'red',
    USE: 'pink'
};

app.listen(port, '0.0.0.0', async () => {
    await openMongoConnection();
    await initializeMailer();

    setTimeout(terminateExpiredSolicitation, 1000);

    for (const controllerNamespace of controllers) {
        Logger.log(`Mapping controller ${bold.yellowBright(controllerNamespace)}`);
        const controllerFiles = readdirSync(path.join(__dirname, 'controllers', controllerNamespace)).filter(file => file.endsWith('.ts'));
        for (const controllerFileName of controllerFiles) {
            const controllerImport: IController = (await import(path.join(__dirname, 'controllers', controllerNamespace, controllerFileName))).controller;
            const urlPath = `/${controllerNamespace}${controllerImport.path}`;
            const method = controllerImport.method;
            const middlewares = [];
            if (controllerImport.authenticationRequired) middlewares.push(
                (request: Request, response: IExpressResponse, next: NextFunction) => verifyTokenMiddleware(request, response, next, controllerImport.requiredRole)
            );

            if (controllerImport.middlewares) middlewares.push(...controllerImport.middlewares);

            middlewares.push(responseMiddleware);
            if (controllerImport.main) middlewares.push(controllerImport.main);

            app[method.toLowerCase() as keyof typeof app](
                urlPath,
                ...middlewares
            );
            Logger.log(`Mapped ${bold.keyword(methodColor[method])(method)} ${bold(urlPath)}`);
        }
    }
    Logger.log(`${bold.cyan('HTTP server')} running on port ${bold(port)}`);
});
