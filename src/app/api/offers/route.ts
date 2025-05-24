import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to generate offer content using AI
async function generateOfferContent(title: string, businessType: string) {
  const prompt = `Create a compelling business offer for a ${businessType} business with the title "${title}". 
  Include:
  1. A detailed description (2-3 sentences)
  2. Key benefits (3-4 points)
  3. Suggested price range
  4. Recommended duration
  Format the response as JSON with these fields: description, benefits, priceRange, duration`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a professional business consultant who creates compelling offers and advertisements."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Failed to generate offer content');
  try {
    return JSON.parse(content);
  } catch {
    throw new Error('Failed to parse AI response');
  }
}

// GET /api/offers - Get all offers for a business
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    const offers = await prisma.offer.findMany({
      where: {
        userId: businessId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

// POST /api/offers - Create a new offer (with or without AI)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // If AI generation is requested
    if (data.generateWithAI) {
      const aiContent = await generateOfferContent(data.title, data.businessType || 'general');
      const offer = await prisma.offer.create({
        data: {
          title: data.title,
          description: aiContent.description,
          benefits: JSON.stringify(aiContent.benefits), // Store as string
          price: parseFloat(aiContent.priceRange.split('-')[0].trim()),
          duration: aiContent.duration,
          userId: session.user.id,
          isAIGenerated: true,
        },
      });
      return NextResponse.json({ offer, aiContent });
    }

    // Regular offer creation
    const offer = await prisma.offer.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        duration: data.duration,
        userId: session.user.id,
      },
    });
    return NextResponse.json(offer);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating offer' },
      { status: 500 }
    );
  }
}

// PUT /api/offers/:id - Update an offer (with or without AI)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const updates = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }

    // If regenerating with AI
    if (updates.regenerateWithAI) {
      const aiContent = await generateOfferContent(updates.title, updates.businessType || 'general');
      const offer = await prisma.offer.update({
        where: {
          id: id,
          userId: session.user.id,
        },
        data: {
          title: updates.title,
          description: aiContent.description,
          price: parseFloat(aiContent.priceRange.split('-')[0].trim()),
          duration: aiContent.duration
        }
      });
      return NextResponse.json({ offer, aiContent });
    }

    // Regular update
    const offer = await prisma.offer.update({
      where: {
        id: id,
        userId: session.user.id,
      },
      data: {
        title: updates.title,
        description: updates.description,
        price: updates.price,
        duration: updates.duration,
      },
    });
    return NextResponse.json(offer);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    );
  }
}

// DELETE /api/offers/:id - Delete an offer
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }

    await prisma.offer.delete({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    );
  }
} 