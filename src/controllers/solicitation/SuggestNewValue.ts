import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { EColetaRole, ISolicitation } from '@datatypes/Database';
import { ISolicitationSuggestNewValue } from '@datatypes/Solicitation';
import { suggestNewValue } from '@utils/Database';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const body: ISolicitationSuggestNewValue = request.body;
    body.authorId = request.user!.id;

    const result: string | null = await suggestNewValue(body);

    if (typeof result === 'string') {
        response.status(400).json({ message: result });
        return;
    }

    response.json({});
}

export const controller: IController = {
    main,
    path: '/value',
    method: 'PUT',
    authenticationRequired: true,
}