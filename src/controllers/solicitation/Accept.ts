import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { EColetaRole, ISolicitation } from '@datatypes/Database';
import { ISolicitationAccept } from '@datatypes/Solicitation';
import { acceptSolicitation, hideAttributes } from '@utils/Database';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const body: ISolicitationAccept = request.body;
    body.employeeId = request.user!.id;

    const result: ISolicitation | string = await acceptSolicitation(body);

    if (typeof result === 'string') {
        response.status(400).json({ message: result });
        return;
    }

    response.json({ data: hideAttributes(result, ['_id']) });
}

export const controller: IController = {
    main,
    path: '/accept',
    method: 'POST',
    authenticationRequired: true,
    requiredRole: [EColetaRole.employee, EColetaRole.admin]
}