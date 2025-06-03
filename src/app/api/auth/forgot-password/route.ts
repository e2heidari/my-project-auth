import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'ایمیل الزامی است' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربری با این ایمیل یافت نشد' },
        { status: 404 }
      );
    }

    // Generate a 6-digit code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    try {
      // Save the reset code in the database
      await prisma.passwordReset.create({
        data: {
          email,
          code: resetCode,
          expiresAt,
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'خطا در ذخیره کد بازیابی' },
        { status: 500 }
      );
    }

    try {
      // Send email with reset code
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'کد بازیابی رمز عبور',
        html: `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">بازیابی رمز عبور</h2>
            <p style="color: #666; line-height: 1.6;">سلام،</p>
            <p style="color: #666; line-height: 1.6;">کد بازیابی رمز عبور شما:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
              ${resetCode}
            </div>
            <p style="color: #666; line-height: 1.6;">این کد تا ۱۵ دقیقه معتبر است.</p>
            <p style="color: #666; line-height: 1.6;">اگر شما درخواست بازیابی رمز عبور نکرده‌اید، لطفاً این ایمیل را نادیده بگیرید.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">این ایمیل از طرف Yelstar ارسال شده است.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      return NextResponse.json(
        { error: 'خطا در ارسال ایمیل' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'کد بازیابی به ایمیل شما ارسال شد'
    });

  } catch (error) {
    console.error('Error in forgot-password:', error);
    return NextResponse.json(
      { error: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
} 