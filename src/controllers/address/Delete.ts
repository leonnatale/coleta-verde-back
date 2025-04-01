import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { deleteAddress } from '@utils/Database';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const index = parseInt(request.params.index);

    if (isNaN(index)) {
        response.status(400).json({ message: 'Invalid index' });
        return;
    }

    const address = await deleteAddress(request.user!.id, index);

    if (typeof address === 'string') {
        response.status(400).json({ message: address });
        return;
    }

    response.json({});
}

export const controller: IController = {
    main,
    path: '/delete/index/:index',
    method: 'DELETE',
    authenticationRequired: true
}