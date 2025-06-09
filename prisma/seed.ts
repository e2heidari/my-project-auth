import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

async function main() {
  console.log('Starting database seeding...')
  
  try {
    console.log('Clearing existing data...')
    // Delete related records first
    await prisma.subscription.deleteMany()
    await prisma.subscriptionPlan.deleteMany()
    await prisma.user.deleteMany()
    
    console.log('Creating subscription plans...')
    await prisma.subscriptionPlan.create({
      data: {
        name: 'Basic Plan',
        description: 'Perfect for getting started',
        price: 9.99,
        currency: 'USD',
        offerLimit: 5,
        features: JSON.stringify([
          '5 offers per month',
          'Basic analytics',
          'Email support'
        ])
      }
    })

    const proPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Pro Plan',
        description: 'For growing businesses',
        price: 19.99,
        currency: 'USD',
        offerLimit: 10,
        features: JSON.stringify([
          '10 offers per month',
          'Priority support',
          'Advanced analytics',
          'Custom branding'
        ])
      }
    })

    // Create Yelstar user account
    console.log('Creating Yelstar user account...')
    const hashedPassword = await bcrypt.hash('12345678', 10)
    const yelstarUser = await prisma.user.create({
      data: {
        email: 'ehsan.heydari@gmail.com',
        password: hashedPassword,
        name: 'Ehsan Heydari',
        emailVerified: new Date(),
        businessName: 'Yelstar',
      },
    })
    console.log('Yelstar user account created:', yelstarUser)

    // Create a Stripe customer for Yelstar
    console.log('Creating Stripe customer for Yelstar...')
    const yelstarStripeCustomer = await stripe.customers.create({
      email: yelstarUser.email!,
      name: yelstarUser.name!,
      metadata: {
        userId: yelstarUser.id
      }
    })
    console.log('Stripe customer created for Yelstar:', yelstarStripeCustomer)

    // Create Pro subscription for Yelstar
    console.log('Creating Pro subscription for Yelstar...')
    const yelstarSubscription = await prisma.subscription.create({
      data: {
        userId: yelstarUser.id,
        planId: proPlan.id,
        stripeCustomerId: yelstarStripeCustomer.id,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    })
    console.log('Pro subscription created for Yelstar:', yelstarSubscription)

    // Verify data was created
    const allPlans = await prisma.subscriptionPlan.findMany()
    const allUsers = await prisma.user.findMany()
    const allSubscriptions = await prisma.subscription.findMany()
    console.log('All plans in database:', allPlans)
    console.log('All users in database:', allUsers)
    console.log('All subscriptions in database:', allSubscriptions)

    console.log('Database seeded successfully!')
  } catch (error) {
    console.error('Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('An error occurred while running the seed command:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 