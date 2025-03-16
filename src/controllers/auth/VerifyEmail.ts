import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { verifyEmail } from '@utils/Database';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const objectId = request.params.objectId;
    const user = await verifyEmail(objectId);

    if (!user) {
        response.status(400).send('O link de verificação é inválido.');
        return;
    }

    response.send('Email verificado com sucesso!');
}

export const controller: IController = {
    main,
    path: '/verify-email/:objectId',
    method: 'GET',
    authenticationRequired: false
}