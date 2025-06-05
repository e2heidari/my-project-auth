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
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const offers = await prisma.offer.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("Error fetching offers:", error);
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

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
        imageUrl: data.imageUrl,
        userId: session.user.id,
        status: 'active',
      },
    });
    return NextResponse.json({ offer });
  } catch (error) {
    console.error("Error creating offer:", error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}

// PUT /api/offers/:id - Update an offer (with or without AI)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { title, description, price, duration, imageUrl } = body;

    // If regenerating with AI
    if (body.regenerateWithAI) {
      const aiContent = await generateOfferContent(title, body.businessType || 'general');
      const offer = await prisma.offer.update({
        where: {
          id: id,
          userId: session.user.id,
        },
        data: {
          title: title,
          description: aiContent.description,
          price: parseFloat(aiContent.priceRange.split('-')[0].trim()),
          duration: aiContent.duration,
          imageUrl: imageUrl,
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
        title: title,
        description: description,
        price: price,
        duration: duration,
        imageUrl: imageUrl,
      },
    });
    return NextResponse.json({ offer });
  } catch (error) {
    console.error("Error updating offer:", error);
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

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    return NextResponse.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    console.error("Error deleting offer:", error);
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    );
  }
} 