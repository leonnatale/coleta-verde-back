import { IAuthLogin } from "@datatypes/Auth";
import { IController, IExpressRequest, IExpressResponse } from "@datatypes/Controllers";

async function main(request: IExpressRequest, response: IExpressResponse) {
    const body = request.body as IAuthLogin;
    
}

export const controller: IController = {
    main,
    path: '/login',
    method: 'POST',
    authenticationRequired: false
}