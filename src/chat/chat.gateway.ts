import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
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
import { AllWsExceptionsFilter } from '../common/filters/ws-exception.filter';
import { GetPresenceDto } from './dtos/get-presence.dto';
import { JoinConversationDto } from './dtos/join-conversation.dto';
import { MessageReadDto } from './dtos/message-read.dto';
import { SendMessageDto } from './dtos/send-message.dto';
import { MessagesService } from './messages.service';
import { PresenceService } from './presence.service';

@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
@UseFilters(new AllWsExceptionsFilter())
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly messagesService: MessagesService,
    private readonly presenceService: PresenceService,
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

      const userId = payload.sub as string;

      console.log('client connected', userId);

      client.data.userId = userId;
      client.join(`user:${userId}`);

      await this.presenceService.userConnected(userId, this.server);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;

    console.log('Client disconnected', userId);

    if (userId) {
      await this.presenceService.userDisconnected(userId, this.server);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinConversationDto,
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
    @MessageBody() payload: SendMessageDto,
  ) {
    const userId = client.data.userId as string;
    if (!userId) {
      client.disconnect();
      return;
    }

    console.log('send_message', payload);

    const message = await this.messagesService.sendMessage(userId, {
      conversationId: payload.conversationId,
      type: payload.type,
      content: payload.content,
      mediaUrl: payload.mediaUrl,
      replyToMessageId: payload.replyToMessageId,
    });

    this.server.to(`conv:${payload.conversationId}`).emit('message', message);
  }

  @SubscribeMessage('message_read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageReadDto,
  ) {
    const userId = client.data.userId as string;
    if (!userId) {
      client.disconnect();
      return;
    }

    console.log('message_read', data);

    await this.messagesService.markMessageRead(userId, data.messageId);

    this.server.emit('message_read', {
      messageId: data.messageId,
      userId,
    });
  }

  @SubscribeMessage('get_presence')
  async handleGetPresence(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GetPresenceDto,
  ) {
    const viewerId = client.data.userId as string;
    if (!viewerId) {
      client.disconnect();
      return;
    }

    const presence = await this.presenceService.getPresenceForViewer(
      data.userId,
      viewerId,
    );

    client.emit('presence_response', {
      userId: data.userId,
      presence,
    });
  }
}
