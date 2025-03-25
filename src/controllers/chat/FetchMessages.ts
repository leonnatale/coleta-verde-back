import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { getChatIdFromOwners, getMessagesFromChat } from '@utils/Database';

async function main(request: IExpressRequest, response: IExpressResponse) {
    const userId = parseInt(request.params.userId);
    const chatId = await getChatIdFromOwners(request.user!.id, userId);

    if (!chatId) {
        response.status(404).json({ message: 'This chat doesn\'t exist' });
        return;
    }

    const messages = await getMessagesFromChat(chatId);

    response.json({ data: messages });
}

export const controller: IController = {
    main,
    path: '/:userId',
    method: 'GET',
    authenticationRequired: true
};
