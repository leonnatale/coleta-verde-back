import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const index = parseInt(request.params.index);
    const address = request.user!.addresses[index];

    if (!address) {
        response.status(404).json({ message: 'Address not found' });
        return;
    }

    response.json({ data: address });
}

export const controller: IController = {
    main,
    path: '/index/:index',
    method: 'GET',
    authenticationRequired: true
}