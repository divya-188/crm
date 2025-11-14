import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/inbox',
})
export class WebSocketGatewayService implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      client.data.userId = userId;
      client.data.tenantId = payload.tenantId;

      // Track user sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);

      // Join tenant room
      if (payload.tenantId) {
        client.join(`tenant:${payload.tenantId}`);
      }

      // Join user room
      client.join(`user:${userId}`);

      console.log(`Client connected: ${client.id}, User: ${userId}`);
      
      // Broadcast user online status
      this.server.to(`tenant:${payload.tenantId}`).emit('user:status', {
        userId,
        status: 'online',
      });
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    const tenantId = client.data.tenantId;

    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
          // Broadcast user offline status
          this.server.to(`tenant:${tenantId}`).emit('user:status', {
            userId,
            status: 'offline',
          });
        }
      }
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
    return { event: 'conversation:joined', data: { conversationId: data.conversationId } };
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    return { event: 'conversation:left', data: { conversationId: data.conversationId } };
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    client.to(`conversation:${data.conversationId}`).emit('typing:start', {
      conversationId: data.conversationId,
      userId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    client.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      conversationId: data.conversationId,
      userId,
    });
  }

  // Server-side methods to emit events
  emitNewMessage(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('message:new', message);
  }

  emitMessageStatus(conversationId: string, messageId: string, status: string) {
    this.server.to(`conversation:${conversationId}`).emit('message:status', {
      messageId,
      status,
    });
  }

  emitConversationUpdate(tenantId: string, conversation: any) {
    this.server.to(`tenant:${tenantId}`).emit('conversation:update', conversation);
  }

  emitNewConversation(tenantId: string, conversation: any) {
    this.server.to(`tenant:${tenantId}`).emit('conversation:new', conversation);
  }
}
