import { config } from 'dotenv';
import Logger from '@utils/Logger';
import express from 'express';
import { openMongoConnection, testGet } from '@utils/Database';

config();

const port = parseInt(process.env['PORT'] ?? '8080');
const app = express();

(async () => {
    /* Quick test */
    await openMongoConnection();
    const lis = await testGet();
    console.log(lis);
})();

app.listen(port, () => Logger.log(`Running on port ${port}`));