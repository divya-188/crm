import { DataSource } from 'typeorm';
import { SubscriptionPlan } from '../../modules/subscriptions/entities/subscription-plan.entity';

export async function seedSubscriptionPlans(dataSource: DataSource) {
  const planRepository = dataSource.getRepository(SubscriptionPlan);

  // Check if plans already exist
  const existingPlans = await planRepository.count();
  if (existingPlans > 0) {
    console.log('Subscription plans already seeded');
    return;
  }

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small businesses and startups getting started with WhatsApp automation',
      price: 49,
      billingCycle: 'monthly',
      features: {
        maxContacts: 2500,
        maxUsers: 3,
        maxConversations: 1000,
        maxCampaigns: 10,
        maxFlows: 5,
        maxAutomations: 15,
        whatsappConnections: 1,
        apiAccess: false,
        customBranding: false,
        prioritySupport: false,
      },
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Growth',
      description: 'Ideal for growing teams that need more power and flexibility',
      price: 149,
      billingCycle: 'monthly',
      features: {
        maxContacts: 10000,
        maxUsers: 10,
        maxConversations: 5000,
        maxCampaigns: 50,
        maxFlows: 20,
        maxAutomations: 50,
        whatsappConnections: 3,
        apiAccess: true,
        customBranding: false,
        prioritySupport: false,
      },
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Professional',
      description: 'Advanced features for established businesses scaling their customer engagement',
      price: 299,
      billingCycle: 'monthly',
      features: {
        maxContacts: 50000,
        maxUsers: 25,
        maxConversations: 25000,
        maxCampaigns: 200,
        maxFlows: 50,
        maxAutomations: 150,
        whatsappConnections: 5,
        apiAccess: true,
        customBranding: true,
        prioritySupport: true,
      },
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'Enterprise',
      description: 'Unlimited power for large organizations with complex requirements and dedicated support',
      price: 799,
      billingCycle: 'monthly',
      features: {
        maxContacts: 250000,
        maxUsers: 100,
        maxConversations: 100000,
        maxCampaigns: 1000,
        maxFlows: 200,
        maxAutomations: 500,
        whatsappConnections: 15,
        apiAccess: true,
        customBranding: true,
        prioritySupport: true,
      },
      isActive: true,
      sortOrder: 4,
    },
  ];

  for (const planData of plans) {
    const plan = planRepository.create(planData);
    await planRepository.save(plan);
  }

  console.log('✅ Subscription plans seeded successfully');
  console.log(`   Created ${plans.length} plans: ${plans.map(p => p.name).join(', ')}`);
}
