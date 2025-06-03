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
  return formattedText;
}

// Helper function to sanitize and enhance input
async function enhanceInput(input: string): Promise<string> {
  const prompt = `لطفاً این متن فارسی را برای استفاده در آگهی تبلیغاتی به‌صورت حرفه‌ای، رسمی و جذاب ویرایش کن:
"${input}"`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'شما ویراستار حرفه‌ای فارسی در حوزه متن‌های تبلیغاتی هستید. متن‌ها باید رسمی، جذاب و تأثیرگذار باشند.'
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

async function generateAdFromOpenAI({
  title,
  description,
  targetPage,
  imageDescription,
}: {
  title: string;
  description: string;
  targetPage: string;
  imageDescription: string;
}): Promise<{ adText: string; imagePrompt: string }> {
  const prompt = `یک بیزینس با مشخصات زیر قصد دارد یک آگهی تبلیغاتی حرفه‌ای ایجاد کند:

عنوان: ${title}
توضیحات اولیه: ${description}
صفحه هدف: ${targetPage}
توضیحات تصویر: ${imageDescription}

لطفاً با توجه به توضیحات اولیه، یک آگهی تبلیغاتی کاملاً جدید و حرفه‌ای با مشخصات زیر ایجاد کن:

متن آگهی باید:
- حداکثر ۱ خط باشد
- رسمی و حرفه‌ای باشد
- جذاب و تأثیرگذار باشد
- متناسب با صفحه هدف باشد
- شامل call to action مناسب باشد
- از واژگان مرتبط با کسب‌وکار استفاده کند
- نباید عیناً از توضیحات اولیه کپی شود
- باید یک متن جدید و خلاقانه باشد

توضیحات تصویر باید:
- دقیق و جزئی باشد
- مناسب برای تولید تصویر حرفه‌ای باشد
- مرتبط با محتوای آگهی باشد
- جذاب و تأثیرگذار باشد
- نباید عیناً از توضیحات اولیه کپی شود
- باید یک توضیح جدید و خلاقانه باشد
- تصویر باید ساده و قابل فهم باشد
- از المان‌های اضافی و غیرضروری پرهیز شود
- کیفیت تصویر باید بالا و حرفه‌ای باشد
- از رنگ‌های جذاب و هماهنگ استفاده کند
- تصویر باید مدرن و حرفه‌ای باشد
- از المان‌های بصری مدرن استفاده کند
- تصویر باید با تمرکز بر روی موضوع اصلی باشد`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'شما یک کپی‌رایتر حرفه‌ای فارسی هستید که در تولید آگهی‌های تبلیغاتی تخصص دارید. شما باید متن‌های ورودی را به آگهی‌های حرفه‌ای و جذاب فارسی تبدیل کنید. متن‌های تولید شده باید رسمی، جذاب و تأثیرگذار باشند و به زبان فارسی روان نوشته شوند. در تولید توضیحات تصویر، تصاویر باید مدرن و حرفه‌ای باشند.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  const response = completion.choices[0]?.message?.content?.trim() || '';
  
  // Split the response into ad text and image prompt
  const [adText, imagePrompt] = response.split('\n\n').map(part => part.trim());

  // Ensure the text is in Persian and properly formatted
  const formattedAdText = formatFarsiText(adText.replace(/^متن آگهی:|^آگهی:|^۱\.|^۱-|^۱\s+/i, '').trim());
  const formattedImagePrompt = formatFarsiText(imagePrompt.replace(/^توضیحات تصویر:|^تصویر:|^۲\.|^۲-|^۲\s+/i, '').trim());

  // Convert the image prompt to English and add modern, professional instructions
  const englishImagePrompt = `Modern professional ${formattedImagePrompt} - high quality - vibrant colors - clean design - minimalist style - professional photography - commercial use - business advertisement - no religious elements - no cultural symbols - focus on main subject`;

  // If the generated text is empty or not in Persian, use the original description
  const finalAdText = formattedAdText && /[\u0600-\u06FF]/.test(formattedAdText) 
    ? formattedAdText 
    : formatFarsiText(description);

  return {
    adText: finalAdText,
    imagePrompt: englishImagePrompt || formatFarsiText(imageDescription)
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, targetPage, imageDescription, hasUploadedImage } = body;

    // Validate required fields
    if (!title || !description || !targetPage) {
      return NextResponse.json(
        { success: false, error: 'لطفاً تمام فیلدهای ضروری را پر کنید' },
        { status: 400 }
      );
    }

    // If no image is uploaded, imageDescription is required
    if (!hasUploadedImage && !imageDescription) {
      return NextResponse.json(
        { success: false, error: 'لطفاً توضیحات تصویر را وارد کنید' },
        { status: 400 }
      );
    }

    // Enhance all text inputs
    const [enhancedTitle, enhancedDescription] = await Promise.all([
      enhanceInput(title),
      enhanceInput(description)
    ]);

    // Only enhance image description if it exists and no image is uploaded
    const enhancedImageDescription = (!hasUploadedImage && imageDescription) 
      ? await enhanceInput(imageDescription) 
      : '';

    // Generate advertisement using OpenAI
    const result = await generateAdFromOpenAI({
      title: enhancedTitle,
      description: enhancedDescription,
      targetPage,
      imageDescription: enhancedImageDescription
    });

    return NextResponse.json({
      success: true,
      adText: result.adText,
      imagePrompt: result.imagePrompt
    });

  } catch (error) {
    console.error('Error in generate-ad:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در تولید آگهی',
        details: error instanceof Error ? error.message : 'خطای ناشناخته'
      },
      { status: 500 }
    );
  }
} 