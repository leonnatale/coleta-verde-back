import { IUpdateUser } from '@datatypes/Auth';
import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { IColetaUser } from '@datatypes/Database';
import { getUserById, hideAttributes, updateUserData } from '@utils/Database';
import { encryptPassword } from '@utils/Passport';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const body: IUpdateUser = request.body || {};
    let user: IColetaUser | null = null;

    const data: IUpdateUser = {};

    if (body.name) data.name = body.name;
    if (body.description) data.description = body.description;
    if (body.password) data.password = encryptPassword(body.password);

    user = await updateUserData(request.user!.id, data);

    if (!user) {
        response.status(400).json({ message: 'Couldn\'t update user data' });
        return;
    }

    user = await getUserById(request.user!.id);

    response.json({ data: hideAttributes(user!, [ 'password', '_id' ]) });
}

export const controller: IController = {
    main,
    path: '/me',
    method: 'PUT',
    authenticationRequired: true
}