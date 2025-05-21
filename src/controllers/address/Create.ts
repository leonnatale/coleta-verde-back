import { IAddressCreation } from '@datatypes/Address';
import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { EColetaRole } from '@datatypes/Database';
import { createAddress } from '@utils/Database';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const body: IAddressCreation = request.body;

    const userId = request.user!.id;
    const newAddress = await createAddress(body, userId);

    if (typeof newAddress === 'string') {
        response.status(400).json({ message: newAddress });
        return;
    }

    response.json({ data: newAddress });
}

export const controller: IController = {
    main,
    path: '/create',
    method: 'POST',
    authenticationRequired: true,
    requiredRole: [ EColetaRole.user, EColetaRole.enterprise, EColetaRole.admin ]
}