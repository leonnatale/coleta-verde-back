import { IController, IExpressRequest, IExpressResponse } from "@datatypes/Controllers";

async function main(request: IExpressRequest, response: IExpressResponse) {
    response.send('test')
}

export const controller: IController = {
    main,
    path: '/chat',
    method: 'GET',
    authenticationRequired: true,
};
