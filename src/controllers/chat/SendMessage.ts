import { IMessageData } from "@datatypes/Chat";
import { IController, IExpressRequest, IExpressResponse } from "@datatypes/Controllers";
import { sendMessage } from "@utils/Database";
import { SSEEmitter } from "@utils/SSE";

async function main(request: IExpressRequest, response: IExpressResponse) {
    const body: IMessageData = request.body || {};
    body.from = request.user!.id;

    const messageResponse = await sendMessage(body);

    if (typeof messageResponse === 'string') {
        response.status(400).json({ message: messageResponse })
        return;
    }

    SSEEmitter.emit(`message:${body.to}`, {
        type: 'new message',
        data: messageResponse
    });

    response.json({});
}

export const controller: IController = {
    main,
    path: '/send',
    method: 'POST',
    authenticationRequired: true
};
