import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { EColetaRole, ISolicitation } from '@datatypes/Database';
import { listAllSolicitations } from '@utils/Database';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const page = parseInt(request.query.page as string || '1');
    const limit = parseInt(request.query.limit as string || '5');

    if (isNaN(page) || isNaN(limit)) {
        response.status(400).json({ message: 'Invalid query number' });
        return;
    }

    if (page <= 0 || limit <= 0) {
        response.status(400).json({ message: 'Query number must be greater than 0' });
        return;
    }

    if (limit >= 20) {
        response.status(400).json({ message: 'Limit must be less than 20' });
        return;
    }

    const result: ISolicitation[] = await listAllSolicitations(page, limit);

    response.json({ data: result });
}

export const controller: IController = {
    main,
    path: '/all',
    method: 'GET',
    authenticationRequired: true,
    requiredRole: [EColetaRole.employee, EColetaRole.admin]
}