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

  // Settings update events
  emitSettingsUpdate(type: string, data: any, tenantId?: string, userId?: string) {
    const event = {
      type,
      data,
      updatedBy: userId,
      timestamp: new Date().toISOString(),
    };

    if (tenantId) {
      // Broadcast to specific tenant
      this.server.to(`tenant:${tenantId}`).emit('settings:updated', event);
      console.log(`Settings update broadcasted to tenant ${tenantId}:`, type);
    } else {
      // Broadcast to all connected clients (platform-wide settings)
      this.server.emit('settings:updated', event);
      console.log(`Settings update broadcasted globally:`, type);
    }
  }

  emitBrandingUpdate(branding: any, tenantId?: string) {
    if (tenantId) {
      // Tenant-specific branding
      this.server.to(`tenant:${tenantId}`).emit('branding:updated', { branding });
      console.log(`Branding update broadcasted to tenant ${tenantId}`);
    } else {
      // Platform-wide branding
      this.server.emit('branding:updated', { branding });
      console.log(`Branding update broadcasted globally`);
    }
  }

  emitPaymentSettingsUpdate(settings: any, userId?: string) {
    this.emitSettingsUpdate('payment', settings, undefined, userId);
  }

  emitEmailSettingsUpdate(settings: any, userId?: string) {
    this.emitSettingsUpdate('email', settings, undefined, userId);
  }

  emitSecuritySettingsUpdate(settings: any, userId?: string) {
    this.emitSettingsUpdate('security', settings, undefined, userId);
  }

  emitWhatsAppSettingsUpdate(settings: any, tenantId: string, userId?: string) {
    this.emitSettingsUpdate('whatsapp', settings, tenantId, userId);
  }

  emitTeamSettingsUpdate(settings: any, tenantId: string, userId?: string) {
    this.emitSettingsUpdate('team', settings, tenantId, userId);
  }

  emitBillingSettingsUpdate(settings: any, tenantId: string, userId?: string) {
    this.emitSettingsUpdate('billing', settings, tenantId, userId);
  }

  emitIntegrationsSettingsUpdate(settings: any, tenantId: string, userId?: string) {
    this.emitSettingsUpdate('integrations', settings, tenantId, userId);
  }

  emitAvailabilitySettingsUpdate(settings: any, userId: string) {
    // Broadcast to specific user
    this.server.to(`user:${userId}`).emit('settings:updated', {
      type: 'availability',
      data: settings,
      timestamp: new Date().toISOString(),
    });
    console.log(`Availability settings update broadcasted to user ${userId}`);
  }

  emitPreferencesSettingsUpdate(settings: any, userId: string) {
    // Broadcast to specific user
    this.server.to(`user:${userId}`).emit('settings:updated', {
      type: 'preferences',
      data: settings,
      timestamp: new Date().toISOString(),
    });
    console.log(`Preferences settings update broadcasted to user ${userId}`);
  }

  // Broadcast to all users in a tenant
  broadcastToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  // Broadcast to specific user
  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Get online users count for a tenant
  getOnlineUsersCount(tenantId: string): number {
    const room = this.server.sockets.adapter.rooms.get(`tenant:${tenantId}`);
    return room ? room.size : 0;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }
}
