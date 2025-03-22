import { IController, IExpressRequest, IExpressResponse } from "@datatypes/Controllers";
import { SSEEmitter } from "@utils/SSE";

async function main(request: IExpressRequest, response: IExpressResponse) {
    SSEEmitter.emit(`message:${request.params.id}`, { abc: 'def' })
    response.send('test');
}

export const controller: IController = {
    main,
    path: '/send/:id',
    method: 'GET',
    authenticationRequired: false,
};
