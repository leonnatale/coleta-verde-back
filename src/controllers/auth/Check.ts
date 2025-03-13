import { IController, IExpressRequest, IExpressResponse } from "@datatypes/Controllers";
import { hideAttributes } from "@utils/Database";

async function main(request: IExpressRequest, response: IExpressResponse) {
    response.json({});
}

export const controller: IController = {
    main,
    path: '/check',
    method: 'GET',
    authenticationRequired: true
}