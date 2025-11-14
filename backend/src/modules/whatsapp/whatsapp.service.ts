import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppConnection, ConnectionStatus, ConnectionType } from './entities/whatsapp-connection.entity';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { MetaApiService } from './services/meta-api.service';

@Injectable()
export class WhatsAppService {
  constructor(
    @InjectRepository(WhatsAppConnection)
    private connectionsRepository: Repository<WhatsAppConnection>,
    private metaApiService: MetaApiService,
  ) {}

  async create(tenantId: string, createConnectionDto: CreateConnectionDto): Promise<WhatsAppConnection> {
    const connection = this.connectionsRepository.create({
      ...createConnectionDto,
      tenantId,
      type: createConnectionDto.type as any,
    });

    // If Meta API, validate credentials
    if (createConnectionDto.type === ConnectionType.META_API) {
      if (!createConnectionDto.phoneNumberId || !createConnectionDto.accessToken) {
        throw new BadRequestException('Phone Number ID and Access Token are required for Meta API');
      }

      try {
        // Verify connection by getting phone number info
        const info = await this.metaApiService.getPhoneNumberInfo(
          createConnectionDto.phoneNumberId,
          createConnectionDto.accessToken,
        );
        connection.phoneNumber = info.display_phone_number;
        connection.status = ConnectionStatus.CONNECTED;
        connection.lastConnectedAt = new Date();
      } catch (error) {
        connection.status = ConnectionStatus.FAILED;
        throw new BadRequestException('Failed to verify WhatsApp credentials');
      }
    } else if (createConnectionDto.type === ConnectionType.BAILEYS) {
      // For Baileys, generate QR code (placeholder - actual implementation would use Baileys library)
      connection.qrCode = this.generatePlaceholderQR();
      connection.status = ConnectionStatus.CONNECTING;
    }

    return this.connectionsRepository.save(connection);
  }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
    type?: string,
    search?: string,
  ): Promise<{ data: WhatsAppConnection[]; total: number; page: number; limit: number; hasMore: boolean }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    
    const query = this.connectionsRepository.createQueryBuilder('connection')
      .where('connection.tenantId = :tenantId', { tenantId });

    if (status) {
      query.andWhere('connection.status = :status', { status });
    }

    if (type) {
      query.andWhere('connection.type = :type', { type });
    }

    if (search) {
      query.andWhere(
        '(connection.name ILIKE :search OR connection.phoneNumber ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .orderBy('connection.createdAt', 'DESC')
      .getManyAndCount();

    const hasMore = pageNum * limitNum < total;

    return { data, total, page: pageNum, limit: limitNum, hasMore };
  }

  async findOne(tenantId: string, id: string): Promise<WhatsAppConnection> {
    const connection = await this.connectionsRepository.findOne({
      where: { id, tenantId },
    });

    if (!connection) {
      throw new NotFoundException(`WhatsApp connection with ID ${id} not found`);
    }

    return connection;
  }

  async update(tenantId: string, id: string, updateData: Partial<WhatsAppConnection>): Promise<WhatsAppConnection> {
    const connection = await this.findOne(tenantId, id);
    Object.assign(connection, updateData);
    return this.connectionsRepository.save(connection);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const result = await this.connectionsRepository.delete({ id, tenantId });
    if (result.affected === 0) {
      throw new NotFoundException(`WhatsApp connection with ID ${id} not found`);
    }
  }

  async disconnect(tenantId: string, id: string): Promise<WhatsAppConnection> {
    const connection = await this.findOne(tenantId, id);
    connection.status = ConnectionStatus.DISCONNECTED;
    connection.lastDisconnectedAt = new Date();
    connection.sessionData = null;
    connection.qrCode = null;
    return this.connectionsRepository.save(connection);
  }

  async reconnect(tenantId: string, id: string): Promise<WhatsAppConnection> {
    const connection = await this.findOne(tenantId, id);

    if (connection.type === ConnectionType.META_API) {
      try {
        await this.metaApiService.getPhoneNumberInfo(
          connection.phoneNumberId,
          connection.accessToken,
        );
        connection.status = ConnectionStatus.CONNECTED;
        connection.lastConnectedAt = new Date();
      } catch (error) {
        connection.status = ConnectionStatus.FAILED;
        throw new BadRequestException('Failed to reconnect to WhatsApp');
      }
    } else if (connection.type === ConnectionType.BAILEYS) {
      connection.qrCode = this.generatePlaceholderQR();
      connection.status = ConnectionStatus.CONNECTING;
    }

    return this.connectionsRepository.save(connection);
  }

  async getQRCode(tenantId: string, id: string): Promise<string> {
    const connection = await this.findOne(tenantId, id);
    
    if (connection.type !== ConnectionType.BAILEYS) {
      throw new BadRequestException('QR code is only available for Baileys connections');
    }

    if (!connection.qrCode) {
      connection.qrCode = this.generatePlaceholderQR();
      await this.connectionsRepository.save(connection);
    }

    return connection.qrCode;
  }

  async sendMessage(
    tenantId: string,
    connectionId: string,
    to: string,
    message: string,
  ): Promise<any> {
    const connection = await this.findOne(tenantId, connectionId);

    if (connection.status !== ConnectionStatus.CONNECTED) {
      throw new BadRequestException('WhatsApp connection is not active');
    }

    if (connection.type === ConnectionType.META_API) {
      return this.metaApiService.sendTextMessage(
        connection.phoneNumberId,
        connection.accessToken,
        to,
        message,
      );
    }

    throw new BadRequestException('Sending messages via Baileys is not yet implemented');
  }

  private generatePlaceholderQR(): string {
    // Placeholder QR code - in production, this would be generated by Baileys
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
  }

  async checkHealth(tenantId: string, id: string): Promise<{ status: string; lastConnected: Date }> {
    const connection = await this.findOne(tenantId, id);
    
    return {
      status: connection.status,
      lastConnected: connection.lastConnectedAt,
    };
  }
}
