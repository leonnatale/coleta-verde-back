import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { IColetaAddress } from '@datatypes/Database';
import { getUserById } from '@utils/Database';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const userAddresses: IColetaAddress[] = (await getUserById(request.user!.id))!.addresses;
    response.json({ data: userAddresses });
}

export const controller: IController = {
    main,
    path: '/all',
    method: 'GET',
    authenticationRequired: true
}