// src/common/filters/ws-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  HttpException,
  WsExceptionFilter,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch(WsException, HttpException)
export class AllWsExceptionsFilter implements WsExceptionFilter {
  catch(exception: WsException | HttpException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const data = host.switchToWs().getData();

    let errorResponse: any;

    if (exception instanceof WsException) {
      const err = exception.getError();
      errorResponse = typeof err === 'string' ? { message: err } : err;
    } else if (exception instanceof HttpException) {
      const res = exception.getResponse();
      errorResponse = typeof res === 'string' ? { message: res } : res;
    } else {
      errorResponse = { message: 'Internal server error' };
    }

    client.emit('ws_error', { error: errorResponse, data });
  }
}
