import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
});

// Helper function to ensure proper Farsi text formatting
function formatFarsiText(text: string): string {
  // First, clean any existing RTL/LTR marks and normalize spaces
  let cleanText = text
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, '') // Remove all directional marks
    .replace(/\s+/g, ' ')
    .trim();

  // Month name correction
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  // Add reversed versions to map
  const monthMap: { [key: string]: string } = {};
  months.forEach((m) => {
    monthMap[m] = m;
    monthMap[m.split('').reverse().join('')] = m; // e.g., enuJ -> June
    monthMap[m.toLowerCase()] = m;
    monthMap[m.toUpperCase()] = m;
  });

  // Regex to find possible month names (LTR or reversed)
  cleanText = cleanText.replace(/([A-Za-z]{3,9})/g, (match) => {
    if (monthMap[match]) {
      // Optionally wrap in LTR marks for safety
      return '\u202A' + monthMap[match] + '\u202C';
    }
    return match;
  });

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
  let result = formattedText.replace(/(\d+%|\d+)/g, '\u202D$1\u202C');

  // Convert all Persian digits to English digits
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const englishDigits = '0123456789';
  result = result.replace(/[۰-۹]/g, d => englishDigits[persianDigits.indexOf(d)]);
  return result;
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
  customMessage,
  startDate,
  endDate
}: {
  discountType: string;
  productOrService: string;
  customMessage?: string;
  startDate: string;
  endDate: string;
}): Promise<string> {
  // Convert date to proper format with strict month names
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `${day} ${months[monthIndex]} ${year}`;
  };

  const formattedEndDate = formatDate(endDate);

  const prompt = `Create a marketing offer in formal Farsi (Persian) for:
- Product/Service: ${productOrService}
- Offer Type: ${discountType}
- Start Date: ${startDate}
- End Date: ${formattedEndDate}
${customMessage ? `- Additional Info: ${customMessage}` : ''}

Requirements:
1. Structure the offer in EXACTLY this format with line breaks (use \n for line breaks):
   First line: Title with the EXACT discount type provided (e.g., if discount type is "30% off", use "تخفیف 30% محصولات")
   Second line: Explanation matching the discount type (e.g., if it's a percentage discount, explain the discount; if it's a free gift, explain the gift)
   Third line: Time limit using the exact dates provided (e.g., "فقط تا ${formattedEndDate}")

Example format (with \n for line breaks):
تخفیف 30% محصولات\n
با خرید هر محصول، 30% تخفیف دریافت کنید\n
فقط تا ${formattedEndDate}

2. Write in simple, clear Farsi (Persian)
3. Follow Persian typography rules:
   - Proper spacing around punctuation
   - Correct use of Persian quotation marks
   - Use English numbers (0,1,2,3,4,5,6,7,8,9) for all numbers and percentages
   - Place punctuation marks at the end of sentences
   - Numbers should be in LTR format (use \u202D and \u202C around numbers)
   - Use ONLY these exact month names: January, February, March, April, May, June, July, August, September, October, November, December
   - Use "محصول" (mahsol) or "کالا" (kala) for products, not "واحد" (vahed), unless the user explicitly uses "واحد" in their input
   - DO NOT add any call to action or encouragement (like "از این فرصت استفاده کنید", "زودتر خرید کنید", "همین حالا خرید کنید") unless the user provides it.
   - DO NOT add any emoji unless the user provides it.
4. DO NOT include any hashtags (#) in the text
5. Use simple, direct language
6. Include only:
   - What is being offered (EXACTLY as specified in the discount type)
   - The discount or special price (EXACTLY as specified)
   - Time limit using the exact dates provided
7. Avoid:
   - Marketing jargon
   - Business strategy terms
   - Complex language
   - English words (except for month names and numbers)
   - Unnecessary prepositions (like "برای")
   - Hashtags (#)
   - The word "انتخابی" when referring to all products
   - Generic time references (like "تا پایان هفته" or "تا پایان ماه")
   - Adding extra offers or gifts not specified in the discount type
   - Persian month names (use English month names)
   - Persian numbers (use English numbers)
   - Adding minimum purchase amounts
   - Adding currency (like تومان)
   - Adding any conditions not specified in the discount type
   - Modifying or misspelling month names
   - Using any month names not in the provided list
   - Adding any context, reason, or event (such as store opening, anniversary, special occasion, etc.) unless it is explicitly mentioned in the input
   - Mentioning any price, currency, or minimum order amount unless it is explicitly provided in the input
   - Adding any call to action (like "سریع سفارش دهید!" or "همین حالا خرید کنید!") unless it is explicitly provided in the input
   - Mentioning or inventing any discount code or promo code unless it is explicitly provided in the input
   - Using "واحد" (vahed) for products unless the user explicitly uses it in their input
   - Adding any call to action or encouragement (like "از این فرصت استفاده کنید", "زودتر خرید کنید", "همین حالا خرید کنید") unless the user provides it.
   - Adding any emoji unless the user provides it.
8. IMPORTANT: 
   - Use English numbers (0-9) for all numbers and percentages
   - Each line MUST be on a separate line
   - First line MUST be the title with the EXACT discount type provided
   - MUST use \n
   - Place punctuation marks at the end of sentences
   - Keep sentences short and direct
   - DO NOT use hashtags (#)
   - DO NOT use "انتخابی" when referring to all products
   - ALWAYS use the exact end date provided in the third line
   - DO NOT add extra offers or gifts not specified in the discount type
   - Numbers must be in LTR format (use \u202D and \u202C around numbers)
   - ALWAYS use ONLY these exact month names: January, February, March, April, May, June, July, August, September, October, November, December
   - ALWAYS use English numbers
   - DO NOT add minimum purchase amounts
   - DO NOT add currency (like تومان)
   - DO NOT add any conditions not specified in the discount type
   - DO NOT modify or misspell month names
   - DO NOT use any month names not in the provided list
   - DO NOT add any context, reason, or event (such as store opening, anniversary, special occasion, etc.) unless it is explicitly mentioned in the input
   - DO NOT mention any price, currency, or minimum order amount unless it is explicitly provided in the input
   - DO NOT add any call to action (like "سریع سفارش دهید!" or "همین حالا خرید کنید!") unless it is explicitly provided in the input
   - DO NOT mention or invent any discount code or promo code unless it is explicitly provided in the input
   - If being creative, only use the information and context provided by the user input—do not add anything else.
   - Use "محصول" (mahsol) or "کالا" (kala) for products, not "واحد" (vahed), unless the user explicitly uses "واحد" in their input
   - DO NOT add any call to action or encouragement (like "از این فرصت استفاده کنید", "زودتر خرید کنید", "همین حالا خرید کنید") unless the user provides it.
   - DO NOT add any emoji unless the user provides it.
9. Make it suitable for social media but WITHOUT hashtags
10. Use proper Persian word spacing
11. Format numbers and percentages in English format (e.g., 20% not ۲۰٪)
12. Do not include any RTL/LTR control characters in the text except around numbers
13. DO NOT include any business names or locations unless specifically provided
14. DO NOT include any call to action or contact information unless provided by the user
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
    - DO NOT use "انتخابی" when referring to all products
    - ALWAYS use the exact end date provided
    - DO NOT add extra offers or gifts not specified in the discount type
    - ALWAYS use ONLY these exact month names: January, February, March, April, May, June, July, August, September, October, November, December
    - ALWAYS use English numbers
    - DO NOT add minimum purchase amounts
    - DO NOT add currency (like تومان)
    - DO NOT add any conditions not specified in the discount type
    - DO NOT modify or misspell month names
    - DO NOT use any month names not in the provided list
    - DO NOT add any context, reason, or event (such as store opening, anniversary, special occasion, etc.) unless it is explicitly mentioned in the input
    - DO NOT mention any price, currency, or minimum order amount unless it is explicitly provided in the input
    - DO NOT add any call to action (like "سریع سفارش دهید!" or "همین حالا خرید کنید!") unless it is explicitly provided in the input
    - DO NOT mention or invent any discount code or promo code unless it is explicitly provided in the input
    - If being creative, only use the information and context provided by the user input—do not add anything else.
    - Use "محصول" (mahsol) or "کالا" (kala) for products, not "واحد" (vahed), unless the user explicitly uses "واحد" in their input
    - DO NOT add any call to action or encouragement (like "از این فرصت استفاده کنید", "زودتر خرید کنید", "همین حالا خرید کنید") unless the user provides it.
    - DO NOT add any emoji unless the user provides it.

Examples of good and bad sentence structures:

Good examples:
- "تخفیف 30% محصولات"
- "با خرید هر محصول، 30% تخفیف دریافت کنید"
- "فقط تا ${formattedEndDate}"

Bad examples (DO NOT USE):
- "تخفیف 30% برای خرید محصولات" (unnecessary preposition)
- "بر روی محصولات انتخابی با خرید هر محصول" (too complex and uses انتخابی)
- "تخفیف ویژه برای محصولات منتخب با شرایط خاص" (too formal and complex)
- "با توجه به شرایط موجود، تخفیف ویژه برای خرید" (too wordy)
- "#تخفیف_ویژه" (hashtags not allowed)
- "تخفیف ۳۰٪ محصولات" (using Persian numbers)
- "فقط تا پایان هفته" (using generic time reference)
- "فقط تا پایان ماه" (using generic time reference)
- "تخفیف 30% محصولات + هدیه رایگان" (adding extra offers not specified)
- "فقط تا 15 می 2024" (using Persian month name)
- "فقط تا ۱۵ می ۲۰۲۴" (using Persian numbers and month name)
- "تخفیف 30% برای سفارش‌های بیش از 100 هزار تومان ..." (adding minimum order amount and currency not provided by user)
- "تخفیف 30% برای سفارش‌های بالای 100,000 تومان ..." (adding minimum order amount and currency not provided by user)
- "سریع سفارش دهید!" (adding call to action not provided by user)
- "همین حالا خرید کنید!" (adding call to action not provided by user)
- "تخفیف 30% برای سفارشات بالای 100,000 تومان ..." (adding minimum order amount and currency not provided by user)
- "با استفاده از کد تخفیف ..." (mentioning a discount code not provided by user)
- "Use promo code ..." (mentioning a promo code not provided by user)
- "یک واحد رایگان" (using واحد for products)
- "دو واحد رایگان" (using واحد for products)
- "از این فرصت استفاده کنید" (adding encouragement not provided by user)
- "زودتر خرید کنید" (adding encouragement not provided by user)
- "🛍️" (adding emoji not provided by user)
- "فقط تا 21 enuj 2025" (incorrect month name format)
- "فقط تا 21 june 2025" (incorrect month name capitalization)
- "فقط تا 21 JUNE 2025" (incorrect month name capitalization)
- "فقط تا 21 jun 2025" (incorrect month name abbreviation)
- "فقط تا 21 Jun 2025" (incorrect month name format)
- "تخفیف 30% محصولات با افتتاح فروشگاه ..." (adding store opening context not provided by user)

Remember:
- Keep sentences short and direct
- Use simple Persian structures
- Avoid unnecessary words and prepositions
- Make it easy to understand at first glance
- MUST use \n
- First line MUST be the title with the EXACT discount type provided
- Place punctuation marks at the end of sentences
- DO NOT use hashtags (#)
- DO NOT use "انتخابی" when referring to all products
- ALWAYS use English numbers (0-9) for all numbers and percentages
- ALWAYS use the exact end date provided in the third line
- DO NOT add extra offers or gifts not specified in the discount type
- Numbers must be in LTR format (use \u202D and \u202C around numbers)
- ALWAYS use ONLY these exact month names: January, February, March, April, May, June, July, August, September, October, November, December
- ALWAYS use English numbers
- DO NOT add minimum purchase amounts
- DO NOT add currency (like تومان)
- DO NOT add any conditions not specified in the discount type
- DO NOT modify or misspell month names
- DO NOT use any month names not in the provided list
- DO NOT add any context, reason, or event (such as store opening, anniversary, special occasion, etc.) unless it is explicitly mentioned in the input
- DO NOT mention any price, currency, or minimum order amount unless it is explicitly provided in the input
- DO NOT add any call to action (like "سریع سفارش دهید!" or "همین حالا خرید کنید!") unless it is explicitly provided in the input
- DO NOT mention or invent any discount code or promo code unless it is explicitly provided in the input
- If being creative, only use the information and context provided by the user input—do not add anything else.
- Use "محصول" (mahsol) or "کالا" (kala) for products, not "واحد" (vahed), unless the user explicitly uses "واحد" in their input
- DO NOT add any call to action or encouragement (like "از این فرصت استفاده کنید", "زودتر خرید کنید", "همین حالا خرید کنید") unless the user provides it.
- DO NOT add any emoji unless the user provides it.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a Farsi (Persian) copywriter. Create offers with EXACTLY this structure:
1. First line: Title with the EXACT discount type provided (e.g., if discount type is "30% off", use "تخفیف 30% محصولات")
2. Second line: Explanation matching the discount type (e.g., if it's a percentage discount, explain the discount; if it's a free gift, explain the gift)
3. Third line: Time limit using the exact dates provided (e.g., "فقط تا ${formattedEndDate}")

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
- First line MUST be the title with the EXACT discount type provided
- MUST use \n for line breaks
- Place punctuation marks at the end of sentences
- Avoid unnecessary words and prepositions
- DO NOT use hashtags (#)
- ALWAYS use the exact end date provided in the third line
- DO NOT add extra offers or gifts not specified in the discount type
- Numbers must be in LTR format (use \u202D and \u202C around numbers)
- ALWAYS use ONLY these exact month names: January, February, March, April, May, June, July, August, September, October, November, December
- ALWAYS use English numbers
- DO NOT add minimum purchase amounts
- DO NOT add currency (like تومان)
- DO NOT add any conditions not specified in the discount type
- DO NOT modify or misspell month names
- DO NOT use any month names not in the provided list
- DO NOT add any context, reason, or event (such as store opening, anniversary, special occasion, etc.) unless it is explicitly mentioned in the input
- DO NOT mention any price, currency, or minimum order amount unless it is explicitly provided in the input
- DO NOT add any call to action (like "سریع سفارش دهید!" or "همین حالا خرید کنید!") unless it is explicitly provided in the input
- DO NOT mention or invent any discount code or promo code unless it is explicitly provided in the input
- If being creative, only use the information and context provided by the user input—do not add anything else.
- Use "محصول" (mahsol) or "کالا" (kala) for products, not "واحد" (vahed), unless the user explicitly uses "واحد" in their input
- DO NOT add any call to action or encouragement (like "از این فرصت استفاده کنید", "زودتر خرید کنید", "همین حالا خرید کنید") unless the user provides it.
- DO NOT add any emoji unless the user provides it.`
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
    const { goal, discountType, productOrService, customMessage, category, startDate, endDate } = body;

    // Validate required fields
    if (!goal || !discountType || !productOrService || !category || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'لطفاً تمام فیلدهای ضروری را پر کنید' },
        { status: 400 }
      );
    }

    // Enhance all text inputs
    const [, enhancedDiscountType, enhancedProductOrService] = await Promise.all([
      enhanceInput(goal),
      enhanceInput(discountType),
      enhanceInput(productOrService),
      enhanceInput(category)
    ]);

    const enhancedCustomMessage = customMessage ? await enhanceInput(customMessage) : undefined;

    // Call OpenAI API and generate the response as before
    const description = await generateOfferFromOpenAI({ 
      discountType: enhancedDiscountType, 
      productOrService: enhancedProductOrService, 
      customMessage: enhancedCustomMessage,
      startDate,
      endDate
    });

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
