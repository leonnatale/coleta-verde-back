import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { EColetaRole, IColetaUser } from '@datatypes/Database';
import { getUserById, hideAttributes } from '@utils/Database';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const id = parseInt(request.params.id);

    if (isNaN(id)) {
        response.status(400).json({ message: `'${id}' is not a number` });
        return;
    }

    const user: IColetaUser | null = await getUserById(id);

    if (!user) {
        response.status(404).json({ message: `User with id '${id}' doesn't exists` });
        return;
    }

    response.json({ data: hideAttributes(user, [ 'password', '_id' ]) });
}

export const controller: IController = {
    main,
    path: '/id/:id',
    method: 'GET',
    authenticationRequired: true,
    requiredRole: EColetaRole.admin
}