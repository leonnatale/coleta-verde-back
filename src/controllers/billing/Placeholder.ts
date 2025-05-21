import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { approveSolicitation, getSolicitationById } from '@utils/Database';

/* This is a placeholder */
async function main(request: IExpressRequest, response: IExpressResponse) {
    const id = Number(request.params.id!);
    const result = await getSolicitationById(id);

    if (!result) {
        response.status(404).json({});
        return;
    }

    if (result.progress != 'paying') {
        response.status(400).json({ message: 'Can\'t approve.' });
        return;
    }

    await approveSolicitation(id);
    response.json({});
}

export const controller: IController = {
    main,
    path: '/approve/:id',
    method: 'POST',
    authenticationRequired: true
}