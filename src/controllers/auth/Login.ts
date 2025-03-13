import { IAuthLogin } from "@datatypes/Auth";
import { IController, IExpressRequest, IExpressResponse } from "@datatypes/Controllers";
import { IColetaUser } from "@datatypes/Database";
import { login } from "@utils/Database";
import { generateToken } from "@utils/Passport";

async function main(request: IExpressRequest, response: IExpressResponse) {
    const body = request.body as IAuthLogin;

    const user: IColetaUser | string = await login(body);
    if (typeof user === 'string') {
        response.status(400).json({ message: user });
        return;
    }

    const token = generateToken(user);

    response.json({ data: token });
}

export const controller: IController = {
    main,
    path: '/login',
    method: 'POST',
    authenticationRequired: false
}