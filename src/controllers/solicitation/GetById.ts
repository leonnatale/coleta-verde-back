import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { EColetaRole, ISolicitation } from '@datatypes/Database';
import { getSolicitationById, hideAttributes } from '@utils/Database';

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

    if (!result || (!unlimitedRoles.includes(request.user!.role) && result.authorId != request.user!.id)) {
        response.status(404).json({ message: 'Not found' });
        return;
    }

    response.json({ data: hideAttributes(result, [ '_id' ]) });
}

export const controller: IController = {
    main,
    path: '/id/:id',
    method: 'GET',
    authenticationRequired: true
}