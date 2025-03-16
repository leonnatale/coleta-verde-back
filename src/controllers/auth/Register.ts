import { IAuthRegister } from '@datatypes/Auth';
import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { IColetaUser } from '@datatypes/Database';
import { registerUser } from '@utils/Database';
import { sendEmailVerification } from '@utils/Mailer';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const body = request.body as IAuthRegister;

    const user: IColetaUser | string = await registerUser(body);
    if (typeof user === 'string') {
        response.status(400).json({ message: user });
        return;
    }

    sendEmailVerification(user.id);

    response.json({ data: user });
}

export const controller: IController = {
    main,
    path: '/register',
    method: 'POST',
    authenticationRequired: false
}