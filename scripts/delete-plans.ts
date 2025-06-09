import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const result = await prisma.subscriptionPlan.deleteMany()
    console.log(`Successfully deleted ${result.count} plans`)
  } catch (error) {
    console.error('Error deleting plans:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 