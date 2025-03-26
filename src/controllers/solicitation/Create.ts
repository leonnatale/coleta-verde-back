import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { EColetaRole, ISolicitation } from '@datatypes/Database';
import { ISolicitationCreation } from '@datatypes/Solicitation';
import { createSolicitation, hideAttributes } from '@utils/Database';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const body: ISolicitationCreation = request.body || {};
    body.authorId = request.user!.id;

    const solicitation: ISolicitation | string = await createSolicitation(body);

    if (typeof solicitation === 'string') {
        response.status(404).json({ message: solicitation });
        return;
    }

    response.json({ data: hideAttributes(solicitation, ['_id']) });
}

export const controller: IController = {
    main,
    path: '/create',
    method: 'POST',
    authenticationRequired: true,
    requiredRole: [EColetaRole.enterprise, EColetaRole.admin]
}