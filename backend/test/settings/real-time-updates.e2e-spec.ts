import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../../src/app.module';

describe('Settings Real-time Updates (e2e)', () => {
  let app: INestApplication;
  let superAdminToken: string;
  let clientSocket: Socket;
  let serverUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0); // Random port

    const address = app.getHttpServer().address();
    serverUrl = `http://localhost:${address.port}`;

    // Login as super admin
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'superadmin@example.com',
        password: 'SuperAdmin123!',
      });

    superAdminToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    await app.close();
  });

  beforeEach((done) => {
    // Connect WebSocket client
    clientSocket = io(`${serverUrl}/inbox`, {
      auth: {
        token: superAdminToken,
      },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      done();
    });

    clientSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      done(error);
    });
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
  });

  describe('Branding Updates', () => {
    it('should broadcast branding updates to all connected clients', (done) => {
      const updatedBranding = {
        colors: {
          primary: '#FF0000',
          secondary: '#00FF00',
          accent: '#0000FF',
          background: '#FFFFFF',
          text: '#000000',
        },
        fonts: {
          heading: 'Roboto',
          body: 'Roboto',
        },
        companyName: 'Test Company',
        tagline: 'Test Tagline',
      };

      // Listen for branding update event
      clientSocket.on('branding:updated', (data) => {
        expect(data).toBeDefined();
        expect(data.branding).toBeDefined();
        expect(data.branding.colors.primary).toBe('#FF0000');
        expect(data.branding.companyName).toBe('Test Company');
        done();
      });

      // Update branding via API
      request(app.getHttpServer())
        .put('/super-admin/settings/branding')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updatedBranding)
        .expect(200)
        .then((response) => {
          expect(response.body.colors.primary).toBe('#FF0000');
        })
        .catch(done);
    }, 10000);

    it('should broadcast generic settings:updated event', (done) => {
      const updatedBranding = {
        colors: {
          primary: '#123456',
          secondary: '#654321',
          accent: '#ABCDEF',
          background: '#FFFFFF',
          text: '#000000',
        },
        fonts: {
          heading: 'Arial',
          body: 'Arial',
        },
        companyName: 'Updated Company',
      };

      // Listen for generic settings update event
      clientSocket.on('settings:updated', (event) => {
        if (event.type === 'branding') {
          expect(event.data).toBeDefined();
          expect(event.data.colors.primary).toBe('#123456');
          expect(event.timestamp).toBeDefined();
          done();
        }
      });

      // Update branding via API
      request(app.getHttpServer())
        .put('/super-admin/settings/branding')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updatedBranding)
        .expect(200)
        .catch(done);
    }, 10000);
  });

  describe('Multiple Clients', () => {
    it('should broadcast to multiple connected clients', (done) => {
      let client1Received = false;
      let client2Received = false;

      const client2 = io(`${serverUrl}/inbox`, {
        auth: {
          token: superAdminToken,
        },
        transports: ['websocket'],
      });

      client2.on('connect', () => {
        const updatedBranding = {
          colors: {
            primary: '#AAAAAA',
            secondary: '#BBBBBB',
            accent: '#CCCCCC',
            background: '#FFFFFF',
            text: '#000000',
          },
          fonts: {
            heading: 'Verdana',
            body: 'Verdana',
          },
          companyName: 'Multi-Client Test',
        };

        // Listen on both clients
        clientSocket.on('branding:updated', (data) => {
          expect(data.branding.companyName).toBe('Multi-Client Test');
          client1Received = true;
          if (client1Received && client2Received) {
            client2.disconnect();
            done();
          }
        });

        client2.on('branding:updated', (data) => {
          expect(data.branding.companyName).toBe('Multi-Client Test');
          client2Received = true;
          if (client1Received && client2Received) {
            client2.disconnect();
            done();
          }
        });

        // Update branding
        request(app.getHttpServer())
          .put('/super-admin/settings/branding')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(updatedBranding)
          .expect(200)
          .catch((error) => {
            client2.disconnect();
            done(error);
          });
      });
    }, 15000);
  });

  describe('Connection Status', () => {
    it('should maintain connection after branding update', (done) => {
      let updateReceived = false;

      clientSocket.on('branding:updated', () => {
        updateReceived = true;
        
        // Verify connection is still active
        setTimeout(() => {
          expect(clientSocket.connected).toBe(true);
          done();
        }, 500);
      });

      const updatedBranding = {
        colors: {
          primary: '#111111',
          secondary: '#222222',
          accent: '#333333',
          background: '#FFFFFF',
          text: '#000000',
        },
        fonts: {
          heading: 'Georgia',
          body: 'Georgia',
        },
        companyName: 'Connection Test',
      };

      request(app.getHttpServer())
        .put('/super-admin/settings/branding')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updatedBranding)
        .expect(200)
        .catch(done);
    }, 10000);
  });
});
