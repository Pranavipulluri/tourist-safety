import { Injectable, Logger } from '@nestjs/common';
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
import { WebsocketService } from './websocket.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(private readonly websocketService: WebsocketService) {}

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Extract token from query parameters
    const token = client.handshake.query.token as string;
    
    if (!token) {
      this.logger.warn(`Client ${client.id} connected without token`);
      client.disconnect();
      return;
    }

    // Validate token (mock validation for now)
    if (!token.startsWith('mock-jwt-token-')) {
      this.logger.warn(`Client ${client.id} connected with invalid token`);
      client.disconnect();
      return;
    }

    // Join client to a room based on their user ID
    const userId = token.replace('mock-jwt-token-', '');
    client.join(`user-${userId}`);
    
    this.logger.log(`Client ${client.id} joined room: user-${userId}`);

    // Send initial data
    const stats = await this.websocketService.getDashboardStats();
    client.emit('dashboard-stats', stats);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Handle cleanup if needed
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  @SubscribeMessage('get-dashboard-stats')
  async handleGetDashboardStats(@ConnectedSocket() client: Socket) {
    const stats = await this.websocketService.getDashboardStats();
    client.emit('dashboard-stats', stats);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket): void {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
  }

  // Broadcast methods for real-time updates
  broadcastAlert(alertData: any) {
    this.server.emit('new-alert', alertData);
  }

  broadcastLocationUpdate(locationData: any) {
    this.server.emit('location-update', locationData);
  }

  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user-${userId}`).emit(event, data);
  }
}