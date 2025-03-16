import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { hideAttributes } from '@utils/Database';

async function main(request: IExpressRequest, response: IExpressResponse) {
    response.json({ data: hideAttributes(request.user!, [ 'password', '_id', 'iat', 'exp' ]) });
}

export const controller: IController = {
    main,
    path: '/me',
    method: 'GET',
    authenticationRequired: true
}