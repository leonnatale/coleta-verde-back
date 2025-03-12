import { IAuthRegister } from "@datatypes/Auth";
import { IController, IExpressRequest, IExpressResponse } from "@datatypes/Controllers";

async function main(request: IExpressRequest, response: IExpressResponse) {
    const body = request.body as IAuthRegister;
    
}

export const controller: IController = {
    main,
    path: '/register',
    method: 'POST',
    authenticationRequired: false
}