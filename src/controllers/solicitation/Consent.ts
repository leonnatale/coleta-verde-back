import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { EColetaRole, ISolicitation } from '@datatypes/Database';
import { ISolicitationConsentFinalValue } from '@datatypes/Solicitation';
import { consentFinalValue } from '@utils/Database';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const body: ISolicitationConsentFinalValue = request.body;
    body.authorId = request.user!.id;

    const result: ISolicitation | string = await consentFinalValue(body);

    if (typeof result === 'string') {
        response.status(400).json({ message: result });
        return;
    }

    response.json({});
}

export const controller: IController = {
    main,
    path: '/consent',
    method: 'PUT',
    authenticationRequired: true,
}