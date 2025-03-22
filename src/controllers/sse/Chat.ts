import { IController, IExpressRequest, IExpressResponse } from '@datatypes/Controllers';
import { fetchMongoConnection } from '@utils/Database';
import { SSE } from '@utils/SSE';

const mongo = fetchMongoConnection();

async function main(request: IExpressRequest, response: IExpressResponse) {
    const stream = new SSE(response);
    const watcher = mongo.collection('User').watch();

    watcher.on('change', (data) => {
        stream.send('change', data);
    });
}

export const controller: IController = {
    main,
    path: '/chat',
    method: 'GET',
    authenticationRequired: true,
};
