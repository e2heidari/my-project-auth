import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
});

// Helper function to ensure proper Farsi text formatting
function formatFarsiText(text: string): string {
  // First, clean any existing RTL/LTR marks and normalize spaces
  const cleanText = text
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, '') // Remove all directional marks
    .replace(/\s+/g, ' ')
    .trim();

  // Format the text with proper Farsi handling
  const formattedText = cleanText
    // Fix percentage formatting
    .replace(/(\d+)\s*٪/g, '$1%') // Convert Persian percentage to English
    .replace(/%(\d+)/g, '$1%') // Fix reversed percentages
    .replace(/(\d+)\s*%/g, '$1%') // Ensure proper spacing
    .replace(/([،؛.])/g, ' $1 ') // Ensure proper spacing around punctuation
    .replace(/\s*([،؛.])\s*/g, '$1 ') // Fix common Persian punctuation issues
    .replace(/\s*([؟!])\s*/g, '$1 ') // Handle question and exclamation marks
    .replace(/\s*([«»])\s*/g, '$1 ') // Handle quotation marks
    .replace(/\s*([()])\s*/g, '$1 ') // Handle parentheses
    .replace(/\s+([ی])\s+/g, '$1 ') // Handle ی
    .replace(/\s+([ا])\s+/g, '$1 ') // Handle ا
    .replace(/\s+([آ])\s+/g, '$1 ') // Handle آ
    .replace(/\s+/g, ' ')
    .trim();

  // Add RTL mark at the beginning and ensure proper wrapping
  // Use LTR mark for numbers and percentages
  return formattedText.replace(/(\d+%)/g, '\u202D$1\u202C');
}

// Helper function to sanitize and enhance input
async function enhanceInput(input: string): Promise<string> {
  const sanitizationPrompt = `Please enhance and sanitize this Persian text for professional business use:
"${input}"

Requirements:
1. Write in formal, professional Farsi (Persian) using proper Persian grammar and vocabulary
2. Keep it concise and impactful, within 2-3 lines, first line should be just the title in bold and 3-8 words, second line should be the offer details, third line should be the professional call to action
3. Avoid informal expressions and slang
4. Use formal business language and follow Persian typography rules
5. Ensure proper spacing, punctuation, and numbers (e.g., ۳۰٪)
6. Include relevant emojis for engagement (if applicable)
7. Follow the structure outlined:
   - First line: Title, concise, impactful, and bold
   - Second line: Offer details, brief and effective
   - Optional: Third line: Professional call to action`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional Persian language editor specializing in business communication. Your task is to create effective, concise, and impactful offers with proper Farsi grammar, punctuation, and typography."
        },
        {
          role: "user",
          content: sanitizationPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const enhancedText = completion.choices[0]?.message?.content?.trim() || input;
    return formatFarsiText(enhancedText);
  } catch (error) {
    console.error('Error in input enhancement:', error);
    return formatFarsiText(input); // Return formatted original input if enhancement fails
  }
}

async function generateOfferFromOpenAI({ 
  discountType,
  productOrService,
  customMessage
}: {
  discountType: string;
  productOrService: string;
  customMessage?: string;
}): Promise<string> {
  const prompt = `Create a simple, clear marketing offer in formal Farsi (Persian) for:
- Product/Service: ${productOrService}
- Offer: ${discountType}
${customMessage ? `- Additional Info: ${customMessage}` : ''}

Requirements:
1. Write in simple, clear Farsi (Persian)
2. Follow Persian typography rules:
   - Proper spacing around punctuation
   - Correct use of Persian quotation marks
   - Use English numbers (0,1,2,3,4,5,6,7,8,9) for all numbers and percentages
3. Keep it to 2 lines maximum
4. Include relevant emojis
5. Follow this structure:
   - First line: Simple offer title
   - Second line: Clear offer details with numbers/dates
6. Use simple, direct language
7. Include only:
   - What is being offered
   - The discount or special price
   - Time limit (if any)
8. Avoid:
   - Marketing jargon
   - Business strategy terms
   - Complex language
   - English words
9. IMPORTANT: Use English numbers (0-9) for all numbers and percentages
10. Make it suitable for social media
11. Use proper Persian word spacing
12. Format numbers and percentages in English format (e.g., 20% not ۲۰٪)
13. Do not include any RTL/LTR control characters in the text
14. DO NOT include any business names or locations unless specifically provided
15. DO NOT include any call to action or contact information
16. DO NOT include any marketing strategy or business terms`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a Farsi (Persian) copywriter. Create simple, clear offers without any marketing jargon or business strategy terms. Focus only on the offer details in plain language."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 150
  });

  const description = completion.choices[0]?.message?.content?.trim();

  if (!description) {
    throw new Error('No valid response from OpenAI');
  }

  return formatFarsiText(description);
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    let { goal, discountType, productOrService, customMessage, category } = body;

    // Validate required fields
    if (!goal || !discountType || !productOrService || !category) {
      return NextResponse.json(
        { success: false, error: 'لطفاً تمام فیلدهای ضروری را پر کنید' },
        { status: 400 }
      );
    }

    // Enhance all text inputs
    [goal, discountType, productOrService, category] = await Promise.all([
      enhanceInput(goal),
      enhanceInput(discountType),
      enhanceInput(productOrService),
      enhanceInput(category)
    ]);

    if (customMessage) {
      customMessage = await enhanceInput(customMessage);
    }

    // Call OpenAI API and generate the response as before
    const description = await generateOfferFromOpenAI({ discountType, productOrService, customMessage });

    return NextResponse.json({
      success: true,
      description: description
    });

  } catch (error) {
    console.error('Error in generate-offer:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'خطا در تولید پیشنهاد',
        details: error instanceof Error ? error.message : 'خطای ناشناخته'
      },
      { status: 500 }
    );
  }
}
