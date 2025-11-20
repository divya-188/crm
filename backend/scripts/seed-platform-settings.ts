import { DataSource } from 'typeorm';
import { PlatformSettings } from '../src/modules/super-admin/entities/platform-settings.entity';

/**
 * Seed default platform settings
 * Run with: npm run seed:platform-settings
 */
async function seedPlatformSettings() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'whatscrm',
    entities: [PlatformSettings],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const settingsRepository = dataSource.getRepository(PlatformSettings);

    // Default Payment Gateway Settings
    const paymentSettings = settingsRepository.create({
      category: 'payment',
      key: 'gateways',
      value: {
        mode: 'test',
        defaultProvider: 'stripe',
        stripe: {
          enabled: false,
          publishableKey: '',
          secretKey: '',
        },
        paypal: {
          enabled: false,
          clientId: '',
          clientSecret: '',
        },
        razorpay: {
          enabled: false,
          keyId: '',
          keySecret: '',
        },
      },
    });

    // Default Email Settings
    const emailSettings = settingsRepository.create({
      category: 'email',
      key: 'smtp',
      value: {
        smtp: {
          host: 'smtp.gmail.com',
          port: 587,
          useSsl: true,
          user: '',
          password: '',
        },
        fromEmail: 'noreply@whatscrm.com',
        fromName: 'WhatsCRM',
      },
    });

    // Default Security Settings
    const securitySettings = settingsRepository.create({
      category: 'security',
      key: 'policies',
      value: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          expiryDays: 90,
        },
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
        lockoutDuration: 900,
        twoFactorEnabled: false,
        twoFactorEnforced: false,
        auditLogging: true,
        ipWhitelist: [],
      },
    });

    // Default Platform Branding
    const brandingSettings = settingsRepository.create({
      category: 'branding',
      key: 'platform',
      value: {
        companyName: 'WhatsCRM',
        tagline: 'WhatsApp CRM Platform',
        logo: null,
        favicon: null,
        colors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#10B981',
          background: '#FFFFFF',
          text: '#1F2937',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        customCSS: '',
      },
    });

    // Save all settings
    await settingsRepository.save([
      paymentSettings,
      emailSettings,
      securitySettings,
      brandingSettings,
    ]);

    console.log('✅ Platform settings seeded successfully');
    console.log('   - Payment gateway settings');
    console.log('   - Email configuration');
    console.log('   - Security policies');
    console.log('   - Platform branding');

  } catch (error) {
    console.error('❌ Error seeding platform settings:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// Run the seed
seedPlatformSettings()
  .then(() => {
    console.log('\n✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
