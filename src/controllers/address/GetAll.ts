import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';

async function main(request: IExpressRequest, response: IExpressResponse) {
    response.json({ data: request.user!.addresses });
}

export const controller: IController = {
    main,
    path: '/all',
    method: 'GET',
    authenticationRequired: true
}