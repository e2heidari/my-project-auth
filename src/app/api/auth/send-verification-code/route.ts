import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { prisma } from "@/lib/db";

// Validate environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  throw new Error("Email configuration is missing");
}

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    // Get request data
    const { email, businessName } = await request.json();
    console.log("Received signup request:", { email, businessName });

    // Validate input
    if (!email || !businessName) {
      return NextResponse.json(
        { error: "نام کسب و کار و ایمیل الزامی است" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "این ایمیل قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    // Generate verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save verification code
    try {
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: verificationCode,
          expires: expiresAt,
        },
      });
      console.log("Verification code saved for:", email);
    } catch (error) {
      console.error("Error saving verification code:", error);
      return NextResponse.json(
        { error: "خطا در ذخیره کد تایید" },
        { status: 500 }
      );
    }

    // Send email to owner
    try {
      console.log("Sending verification code to owner");
      const info = await transporter.sendMail({
        from: `"Yelstar System" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: "درخواست ثبت نام جدید",
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">درخواست ثبت نام جدید</h2>
            <p style="color: #666; line-height: 1.6;">یک درخواست ثبت نام جدید دریافت شده است:</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p><strong>نام کسب و کار:</strong> ${businessName}</p>
              <p><strong>ایمیل:</strong> ${email}</p>
            </div>
            <p style="color: #666; line-height: 1.6;">کد تایید برای این کاربر:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
              ${verificationCode}
            </div>
            <p style="color: #666; line-height: 1.6;">این کد تا 15 دقیقه معتبر است.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">این ایمیل توسط سیستم یل‌استار ارسال شده است.</p>
          </div>
        `,
      });
      console.log("Email sent successfully:", info.messageId);
    } catch (error) {
      console.error("Error sending email:", error);
      
      // Delete verification token if email fails
      try {
        await prisma.verificationToken.delete({
          where: {
            identifier: email,
            token: verificationCode,
          },
        });
        console.log("Verification token deleted after email failure");
      } catch (deleteError) {
        console.error("Error deleting verification token:", deleteError);
      }

      return NextResponse.json(
        { error: "خطا در ارسال ایمیل تایید" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "درخواست ثبت نام با موفقیت ارسال شد. لطفاً منتظر تایید باشید.",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطا در ارسال درخواست ثبت نام" },
      { status: 500 }
    );
  }
} 