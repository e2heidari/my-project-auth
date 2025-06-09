import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')
  
  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.subscriptionPlan.deleteMany()
  await prisma.user.deleteMany()
  console.log('Existing data cleared.')

  // Create subscription plans
  console.log('Creating Basic Plan...')
  const basicPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Basic Plan',
      description: 'Perfect for small businesses',
      price: 9.99,
      currency: 'USD',
      offerLimit: 5,
      features: JSON.stringify(['Basic features', '5 offers per month', 'Email support']),
    },
  })
  console.log('Basic Plan created:', basicPlan)

  console.log('Creating Pro Plan...')
  const proPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Pro Plan',
      description: 'Ideal for growing businesses',
      price: 19.99,
      currency: 'USD',
      offerLimit: 10,
      features: JSON.stringify(['All Basic features', '10 offers per month', 'Priority support', 'Advanced analytics']),
    },
  })
  console.log('Pro Plan created:', proPlan)

  // Create user account
  console.log('Creating user account...')
  const hashedPassword = await bcrypt.hash('12345678', 10)
  const user = await prisma.user.create({
    data: {
      email: 'ehsan.heydari@gmail.com',
      password: hashedPassword,
      name: 'Ehsan Heydari',
      emailVerified: new Date(),
      businessName: 'Ehsan Business',
    },
  })
  console.log('User account created:', user)

  // Create subscription for the user
  console.log('Creating subscription...')
  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: proPlan.id,
      stripeCustomerId: 'cus_' + user.id, // Temporary ID for seeding
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  })
  console.log('Subscription created:', subscription)

  // Verify data was created
  const allPlans = await prisma.subscriptionPlan.findMany()
  const allUsers = await prisma.user.findMany()
  const allSubscriptions = await prisma.subscription.findMany()
  console.log('All plans in database:', allPlans)
  console.log('All users in database:', allUsers)
  console.log('All subscriptions in database:', allSubscriptions)

  console.log('Database has been seeded. 🌱')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 