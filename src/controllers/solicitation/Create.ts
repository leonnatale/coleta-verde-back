import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { ISolicitation } from '@datatypes/Database';
import { ISolicitationCreation } from '@datatypes/Solicitation';
import { createSolicitation, hideAttributes } from '@utils/Database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const uploadImageStorage = multer.diskStorage({
    destination: path.join(process.cwd(), 'uploads'),
    filename(request: IExpressRequest, file, callback) {
        const userDir = path.join(process.cwd(), 'uploads', String(request.user?.id));
        if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
        const lastIndex = fs.readdirSync(userDir).length;
        callback(null, path.join(String(request.user?.id), lastIndex + path.extname(file.originalname)));
    }
});

export const uploadImageMiddleware = multer({
    fileFilter: (request, file, callback) => {
        const allowedTypes = /jpeg|jpg|png/;
        const isMimeTypeValid = allowedTypes.test(file.mimetype);
        const isExtNameValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        (request as any).file = {
            ...file,
            accepted: true
        };
        
        if (isMimeTypeValid && isExtNameValid) return callback(null, true);
        (request as any).file.accepted = false;
        callback(new Error('Invalid type'));
    },
    storage: uploadImageStorage,
    limits: {
        files: 1,
        fileSize: 5 * 1024 * 1024 /* 5mb */
    }
});

async function main(request: IExpressRequest, response: IExpressResponse) {
    const body: ISolicitationCreation = JSON.parse({ ...request.body }.solicitation) ?? {};
    body.authorId = request.user!.id;

    const solicitation: ISolicitation | string = await createSolicitation(body, request.file);

    if (typeof solicitation === 'string') {
        if (request.file) fs.rmSync(request.file.path);
        response.status(400).json({ message: solicitation });
        return;
    }

    response.json({ data: hideAttributes(solicitation, ['_id']) });
}

export const controller: IController = {
    main,
    path: '/create',
    method: 'POST',
    authenticationRequired: true,
    middlewares: [ uploadImageMiddleware.single('image') ]
}