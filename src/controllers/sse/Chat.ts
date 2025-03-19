import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';

async function main(request: IExpressRequest, response: IExpressResponse) {
    response.set({
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
        'Access-Control-Allow-Origin': '*',
        Connection: 'keep-alive'
    });
    response.flushHeaders();

    setInterval(() => {
        response.write(`data: ${JSON.stringify({
            data: 'test'
        })}\n\n`);
    }, 5_000)
    request.on('close', () => response.end());
}

export const controller: IController = {
    main,
    path: '/chat',
    method: 'GET',
    authenticationRequired: true,
};
