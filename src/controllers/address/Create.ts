import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';

async function main(request: IExpressRequest, response: IExpressResponse) {

}

export const controller: IController = {
    main,
    path: '/create',
    method: 'POST',
    authenticationRequired: true
}