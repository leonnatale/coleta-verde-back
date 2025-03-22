import { IExpressResponse } from "@datatypes/Controllers";
import EventEmitter from "events";

export const SSEEmitter = new EventEmitter();

export class SSE {
    private response: IExpressResponse;

    constructor(response: IExpressResponse) {
        this.response = response;

        response.set({
            'Cache-Control': 'no-cache',
            'Content-Type': 'text/event-stream',
            'Access-Control-Allow-Origin': '*',
            Connection: 'keep-alive'
        });
        response.flushHeaders();

        response.on('close', response.end);
    }

    send<T>(type: string, data: T) {
        const responseData = JSON.stringify({ type, data });
        this.response.write(`data: ${responseData}\n\n`);
    }

    on(event: string, callback: any) {
        this.response.on(event, callback);
    }
}