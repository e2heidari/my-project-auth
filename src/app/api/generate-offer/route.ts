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
  const prompt = `Create a marketing offer in formal Farsi (Persian) for:
- Product/Service: ${productOrService}
- Offer: ${discountType}
${customMessage ? `- Additional Info: ${customMessage}` : ''}

Requirements:
1. Structure the offer in EXACTLY this format with line breaks (use \n for line breaks):
   First line: Title with discount/offer (e.g., "تخفیف 30% محصولات")
   Second line: Explanation (e.g., "با خرید هر محصول، یک هدیه رایگان دریافت کنید")
   Optional third line: Time limit (e.g., "فقط تا پایان هفته")

Example format (with \n for line breaks):
تخفیف 30% محصولات\n
با خرید هر محصول، یک هدیه رایگان دریافت کنید\n
فقط تا پایان هفته

2. Write in simple, clear Farsi (Persian)
3. Follow Persian typography rules:
   - Proper spacing around punctuation
   - Correct use of Persian quotation marks
   - Use English numbers (0,1,2,3,4,5,6,7,8,9) for all numbers and percentages
   - Place punctuation marks at the end of sentences
4. DO NOT include any hashtags (#) in the text
5. Use simple, direct language
6. Include only:
   - What is being offered
   - The discount or special price
   - Time limit (if any)
7. Avoid:
   - Marketing jargon
   - Business strategy terms
   - Complex language
   - English words
   - Unnecessary prepositions (like "برای")
   - Hashtags (#)
8. IMPORTANT: 
   - Use English numbers (0-9) for all numbers and percentages
   - Each line MUST be on a separate line
   - First line MUST be the title with the discount/offer
   - MUST use \n for line breaks
   - Place punctuation marks at the end of sentences
   - Keep sentences short and direct
   - DO NOT use hashtags (#)
9. Make it suitable for social media but WITHOUT hashtags
10. Use proper Persian word spacing
11. Format numbers and percentages in English format (e.g., 20% not ۲۰٪)
12. Do not include any RTL/LTR control characters in the text
13. DO NOT include any business names or locations unless specifically provided
14. DO NOT include any call to action or contact information
15. DO NOT include any marketing strategy or business terms
16. DO NOT include any hashtags (#)
17. Persian Sentence Structure Rules:
    - Use proper Persian grammar and word order
    - Keep sentences short and focused
    - Make sure each line is easy to understand
    - Use natural Persian expressions
    - Avoid complex sentence structures
    - Ensure proper subject-verb agreement
    - Use appropriate Persian prepositions
    - Maintain consistent formality level
    - Place punctuation marks at the end of sentences
    - Avoid unnecessary words and prepositions
    - DO NOT use hashtags (#)

Examples of good and bad sentence structures:

Good examples:
- "تخفیف 30% محصولات"
- "با خرید هر محصول، یک هدیه رایگان دریافت کنید"
- "فقط تا پایان هفته"

Bad examples (DO NOT USE):
- "تخفیف 30% برای خرید محصولات" (unnecessary preposition)
- "بر روی محصولات انتخابی با خرید هر محصول" (too complex)
- "تخفیف ویژه برای محصولات منتخب با شرایط خاص" (too formal and complex)
- "با توجه به شرایط موجود، تخفیف ویژه برای خرید" (too wordy)
- "#تخفیف_ویژه" (hashtags not allowed)

Remember:
- Keep sentences short and direct
- Use simple Persian structures
- Avoid unnecessary words and prepositions
- Make it easy to understand at first glance
- MUST use \n for line breaks
- First line MUST be the title
- Place punctuation marks at the end of sentences
- DO NOT use hashtags (#)`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a Farsi (Persian) copywriter. Create offers with EXACTLY this structure:
1. First line: Title with discount/offer (e.g., "تخفیف 30% محصولات")
2. Second line: Explanation (e.g., "با خرید هر محصول، یک هدیه رایگان دریافت کنید")
3. Optional third line: Time limit (e.g., "فقط تا پایان هفته")

Important rules:
- Each line must be on a separate line using \n
- Use simple, clear Persian sentences
- Keep each line short and focused
- Use proper Persian grammar and word order
- Make sure the offer is easy to understand at first glance
- Follow all Persian typography and formatting rules
- Use natural Persian expressions
- Maintain consistent formality level
- AVOID complex sentence structures
- Keep it simple and direct
- First line MUST be the title
- MUST use \n for line breaks
- Place punctuation marks at the end of sentences
- Avoid unnecessary words and prepositions
- DO NOT use hashtags (#)`
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
