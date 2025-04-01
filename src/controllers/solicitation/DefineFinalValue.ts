import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { EColetaRole, ISolicitation } from '@datatypes/Database';
import { ISolicitationFinalValue } from '@datatypes/Solicitation';
import { hideAttributes, setFinalValue } from '@utils/Database';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const body: ISolicitationFinalValue = request.body;
    body.employeeId = request.user!.id;

    const result: ISolicitation | string = await setFinalValue(body);

    if (typeof result === 'string') {
        response.status(400).json({ message: result });
        return;
    }

    response.json({ data: hideAttributes(result, ['_id']) });
}

export const controller: IController = {
    main,
    path: '/value',
    method: 'PUT',
    authenticationRequired: true,
    requiredRole: [ EColetaRole.employee, EColetaRole.admin ]
}