import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { SSE, SSEEmitter } from '@utils/SSE';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const stream = new SSE(response);
    const chatEvent = `message:${request.user!.id}`;

    stream.on('connection', () => stream.send('welcome', 'connected'));

    SSEEmitter.on(chatEvent, (messageData: any) => {
        stream.send('message', messageData);
    });
}

export const controller: IController = {
    main,
    path: '/chat',
    method: 'GET',
    authenticationRequired: true,
};
