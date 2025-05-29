import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
});

// --- Category Type Map ---
const categoryTypeMap: Record<string, 'product' | 'service' | 'content'> = {
  // Services
  'beauty-salon': 'service',
  'health-beauty': 'service',
  'realtor': 'service',
  'lawyer': 'service',
  'notary-public': 'service',
  'immigration': 'service',
  'dentist': 'service',
  'psychotherapist': 'service',
  'massage': 'service',
  'teacher-trainer': 'service',
  'it-service': 'service',
  'photographer-videographer': 'service',
  'cleaning': 'service',
  'driving-school': 'service',
  'event-planner': 'service',
  'florist': 'service',
  'restaurant': 'service',
  'cafe': 'service',
  'hookah-lounge': 'service',
  'gym': 'service',
  'tattoo': 'service',
  'moving-service': 'service',
  'accountant': 'service',
  'mortgage-broker': 'service',
  'exchange': 'service',
  'insurance': 'service',
  'chiropractor': 'service',
  'acupuncturist': 'service',
  'plumber': 'service',
  'electrician-lighting': 'service',
  // Products
  'clothing': 'product',
  'gift-shop': 'product',
  'carpet-furniture': 'product',
  'jewelry': 'product',
  'market-bakery': 'product',
  'decoration': 'product',
  'food-shopping': 'product',
  'cake-sweet': 'product',
  'pickles-sour': 'product',
  // Content Creators
  'blogger-entertainment': 'content',
  'food-blogger': 'content',
  'comedy': 'content',
  'channel-magazine': 'content',
  'podcast': 'content',
  'association': 'content',
  'magazine': 'content',
  'tv': 'content',
  'radio': 'content',
};

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
  const prompt = `لطفاً این متن فارسی را برای استفاده رسمی تجاری به‌صورت حرفه‌ای، رسمی و کوتاه ویرایش کن:
"${input}"`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'شما ویراستار حرفه‌ای فارسی در حوزه متن‌های تجاری هستید. متن‌ها باید رسمی، دقیق و کوتاه باشند.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 120
    });

    return formatFarsiText(completion.choices[0]?.message?.content?.trim() || input);
  } catch {
    return formatFarsiText(input);
  }
}

// Post-processing: Only convert Persian digits to English and fix discount percentage
function fixNumbersAndDiscount(text: string, discount: string): string {
  // Convert all Persian digits to English digits
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const englishDigits = '0123456789';
  let fixed = text.replace(/[۰-۹]/g, d => englishDigits[persianDigits.indexOf(d)]);
  
  // Fix discount number (e.g., 52% -> 25%)
  const discountNumber = discount.match(/\d+/)?.[0];
  if (discountNumber) {
    fixed = fixed.replace(/\d{1,3}%/g, `${discountNumber}%`);
  }

  // Ensure proper spacing around numbers and percentages
  fixed = fixed
    .replace(/(\d+)\s*٪/g, '$1%')
    .replace(/%(\d+)/g, '$1%')
    .replace(/(\d+)\s*%/g, '$1%');

  // Wrap numbers and percentages with LTR marks
  fixed = fixed.replace(/(\d+%|\d+)/g, '\u202D$1\u202C');

  return fixed;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  // Wrap month with LTR marks to prevent RTL reversal in Farsi text
  const ltrMonth = `\u202A${months[date.getMonth()]}\u202C`;
  // Wrap numbers with LTR marks
  const day = `\u202A${date.getDate()}\u202C`;
  const year = `\u202A${date.getFullYear()}\u202C`;
  return `${day} ${ltrMonth} ${year}`;
}

// Force LTR for English months and numbers
function forceLTRForEnglishMonthsAndNumbers(text: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthRegex = new RegExp(months.join('|'), 'g');
  const numberRegex = /\d+%?/g;
  // Wrap months with LTR mark
  let result = text.replace(monthRegex, match => `\u202A${match}\u202C`);
  // Wrap numbers with LTR mark
  result = result.replace(numberRegex, match => `\u202A${match}\u202C`);
  return result;
}

async function generateOfferFromOpenAI({
  discountType,
  productOrService,
  customMessage,
  startDate,
  endDate,
  category,
  goal
}: {
  discountType: string;
  productOrService: string;
  customMessage?: string;
  startDate: string;
  endDate: string;
  category: string;
  goal: string;
}): Promise<string> {
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  const categoryType = categoryTypeMap[category] || 'service';
  const typeLabel = categoryType === 'service' ? 'خدمات' : categoryType === 'product' ? 'محصولات' : 'محتوا';

  const prompt = `بیزینسی با موضوع "${productOrService}" در دسته‌بندی ${category} که مربوط به ${typeLabel} است، قصد دارد با هدف "${goal}"، پیشنهادی با نوع تخفیف "${discountType}" از تاریخ ${formattedStartDate} تا ${formattedEndDate} ارائه دهد. ${customMessage ? `جزئیات تکمیلی: ${customMessage}` : ''}

لطفاً یک پیشنهاد جذاب، رسمی و مؤثر در حداکثر ۳ خط بنویس، با توجه به اینکه این مورد مربوط به ${typeLabel} است. از واژگان مرتبط با ${typeLabel} استفاده کن.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'شما یک کپی‌رایتر فارسی هستید که وظیفه تولید پیشنهادهای بازاریابی متناسب با نوع بیزینس (محصول، خدمات یا محتوا) را دارد. لطفاً از واژگان مرتبط استفاده کنید، از کلی‌گویی یا جملات بی‌ربط خودداری کنید، و ماه‌ها و اعداد را به صورت صحیح و انگلیسی نمایش دهید.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.5,
    max_tokens: 200
  });

  let description = completion.choices[0]?.message?.content?.trim() || '';
  description = fixNumbersAndDiscount(description, discountType);
  description = forceLTRForEnglishMonthsAndNumbers(description);
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
    const [enhancedGoal, enhancedDiscountType, enhancedProductOrService] = await Promise.all([
      enhanceInput(goal),
      enhanceInput(discountType),
      enhanceInput(productOrService)
    ]);

    const enhancedCustomMessage = customMessage ? await enhanceInput(customMessage) : undefined;

    // Call OpenAI API and generate the response
    const description = await generateOfferFromOpenAI({
      discountType: enhancedDiscountType,
      productOrService: enhancedProductOrService,
      customMessage: enhancedCustomMessage,
      startDate,
      endDate,
      category,
      goal: enhancedGoal
    });

    return NextResponse.json({
      success: true,
      description
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

