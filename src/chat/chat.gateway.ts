// src/chat/chat.gateway.ts
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SendMessageDto } from './dtos/send-message.dto';
import { MessagesService } from './messages.service';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token as string | undefined;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload: any = this.jwt.verify(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });

      console.log('client connected');

      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    console.log('Client disconnected');
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;
    const userId = client.data.userId as string;

    if (!userId) {
      client.disconnect();
      return;
    }

    console.log('join_conversation', data);

    client.join(`conv:${conversationId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: Omit<SendMessageDto, 'conversationId'> & {
      conversationId: string;
    },
  ) {
    const userId = client.data.userId as string;
    if (!userId) {
      client.disconnect();
      return;
    }

    console.log('send_message', payload);

    const dto: SendMessageDto = {
      conversationId: payload.conversationId,
      type: payload.type,
      content: payload.content,
      mediaUrl: payload.mediaUrl,
      replyToMessageId: payload.replyToMessageId,
    };

    const message = await this.messagesService.sendMessage(userId, dto);

    this.server.to(`conv:${payload.conversationId}`).emit('message', message);
  }

  @SubscribeMessage('message_read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = client.data.userId as string;
    if (!userId) {
      client.disconnect();
      return;
    }

    console.log('send_message', data);

    await this.messagesService.markMessageRead(userId, data.messageId);

    this.server.emit('message_read', {
      messageId: data.messageId,
      userId,
    });
  }
}
