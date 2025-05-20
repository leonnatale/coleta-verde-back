import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { EColetaRole, ISolicitation } from '@datatypes/Database';
import { cancelSolicitation, getSolicitationById, hideAttributes } from '@utils/Database';

const unlimitedRoles = [
    EColetaRole.employee,
    EColetaRole.admin
];

async function main(request: IExpressRequest, response: IExpressResponse) {
    const id = parseInt(request.params.id);

    if (isNaN(id)) {
        response.status(400).json({ message: `'${id}' is not a number` });
        return;
    }

    const result: ISolicitation | null = await getSolicitationById(id);

    if (!result || result.authorId != request.user!.id) {
        response.status(404).json({ message: 'Not found' });
        return;
    }

    if ([ 'expired', 'cancelled', 'finished' ].includes(result.progress)) {
        response.status(400).json({ message: 'Couldn\'t cancel this solicitation' });
        return;
    }

    await cancelSolicitation(id);

    response.json({});
}

export const controller: IController = {
    main,
    path: '/cancel/:id',
    method: 'PUT',
    authenticationRequired: true
}