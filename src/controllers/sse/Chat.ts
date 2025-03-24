import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { IEventData } from '@datatypes/SSE';
import { SSE, SSEEmitter } from '@utils/SSE';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const stream = new SSE(response);
    const chatEvent = `message:${request.user!.id}`;

    const eventListener = (messageData: IEventData<any>) => stream.send(messageData.type, messageData.data);

    stream.send('welcome', 'connected');

    SSEEmitter.on(chatEvent, eventListener);

    stream.on('close', () => SSEEmitter.off(chatEvent, eventListener));
}

export const controller: IController = {
    main,
    path: '/chat',
    method: 'GET',
    authenticationRequired: true
};
