import { DataSource } from 'typeorm';

export class InitialSeed {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('🌱 Running initial seed...');

    // Seed subscription plans
    await this.seedSubscriptionPlans(dataSource);

    console.log('✅ Initial seed completed');
  }

  private async seedSubscriptionPlans(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Check if plans already exist
      const existingPlans = await queryRunner.query(
        'SELECT COUNT(*) as count FROM subscription_plans'
      );

      if (parseInt(existingPlans[0].count) > 0) {
        console.log('Subscription plans already exist, skipping...');
        return;
      }

      // Insert default plans
      await queryRunner.query(`
        INSERT INTO subscription_plans (name, description, price, "billingCycle", features, "isActive", "sortOrder")
        VALUES
        (
          'Free',
          'Perfect for trying out the platform',
          0,
          'monthly',
          '{"maxContacts": 100, "maxUsers": 1, "maxConversations": 50, "maxCampaigns": 1, "maxFlows": 2, "maxAutomations": 2, "whatsappConnections": 1, "apiAccess": false, "customBranding": false, "prioritySupport": false}',
          true,
          1
        ),
        (
          'Starter',
          'Great for small businesses getting started',
          29,
          'monthly',
          '{"maxContacts": 1000, "maxUsers": 3, "maxConversations": 500, "maxCampaigns": 10, "maxFlows": 10, "maxAutomations": 10, "whatsappConnections": 2, "apiAccess": true, "customBranding": false, "prioritySupport": false}',
          true,
          2
        ),
        (
          'Professional',
          'For growing businesses with advanced needs',
          99,
          'monthly',
          '{"maxContacts": 10000, "maxUsers": 10, "maxConversations": 5000, "maxCampaigns": 50, "maxFlows": 50, "maxAutomations": 50, "whatsappConnections": 5, "apiAccess": true, "customBranding": true, "prioritySupport": true}',
          true,
          3
        ),
        (
          'Enterprise',
          'Unlimited power for large organizations',
          299,
          'monthly',
          '{"maxContacts": 100000, "maxUsers": 50, "maxConversations": 50000, "maxCampaigns": 200, "maxFlows": 200, "maxAutomations": 200, "whatsappConnections": 20, "apiAccess": true, "customBranding": true, "prioritySupport": true}',
          true,
          4
        )
      `);

      console.log('✅ Subscription plans seeded');
    } catch (error) {
      console.error('Error seeding subscription plans:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

// Run seed if called directly
if (require.main === module) {
  const { AppDataSource } = require('./data-source');

  AppDataSource.initialize()
    .then(async (dataSource: DataSource) => {
      const seed = new InitialSeed();
      await seed.run(dataSource);
      await dataSource.destroy();
      process.exit(0);
    })
    .catch((error: Error) => {
      console.error('Error running seed:', error);
      process.exit(1);
    });
}
