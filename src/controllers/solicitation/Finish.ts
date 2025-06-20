import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { EColetaRole, ISolicitation } from '@datatypes/Database';
import { cancelSolicitation, finishSolicitation, getSolicitationById, hideAttributes } from '@utils/Database';

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

    if (!result || result.employeeId != request.user!.id) {
        response.status(404).json({ message: 'Not found' });
        return;
    }

    if (result.progress !== 'inProgress') {
        response.status(400).json({ message: 'Couldn\'t finish this solicitation' });
        return;
    }

    await finishSolicitation(id, request.user!.id);

    response.json({});
}

export const controller: IController = {
    main,
    path: '/finish/:id',
    method: 'PUT',
    authenticationRequired: true,
    requiredRole: EColetaRole.employee
}