import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";
import logger from "@/lib/logger";

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Rate limiting configuration
const RATE_LIMIT = 3; // attempts
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const emailAttempts = new Map<string, { count: number; resetTime: number }>();

// Clean up old rate limit entries every hour
setInterval(() => {
  const now = Date.now();
  Array.from(emailAttempts.entries()).forEach(([email, data]) => {
    if (now > data.resetTime) {
      emailAttempts.delete(email);
    }
  });
}, 60 * 60 * 1000);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check rate limit
    const now = Date.now();
    const attemptData = emailAttempts.get(email) ?? { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    
    if (attemptData.count >= RATE_LIMIT) {
      const timeLeft = Math.ceil((attemptData.resetTime - now) / 60000); // minutes
      return NextResponse.json(
        { error: `Too many attempts. Please try again in ${timeLeft} minutes.` },
        { status: 429 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json(
        { message: 'If an account exists with this email, a recovery code will be sent' },
        { status: 200 }
      );
    }

    // Generate a 6-digit code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    try {
      // Delete any existing reset codes for this email
      await prisma.passwordReset.deleteMany({
        where: { email }
      });

      // Save the reset code in the database
      await prisma.passwordReset.create({
        data: {
          email,
          code: resetCode,
          expiresAt,
        },
      });

      // Log the reset code request
      logger.info("Password reset code requested", {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      // Send email with reset code
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Recovery Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333; text-align: center;">Password Recovery</h2>
            <p style="color: #666; line-height: 1.6;">Hello,</p>
            <p style="color: #666; line-height: 1.6;">Your password recovery code:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
              ${resetCode}
            </div>
            <p style="color: #666; line-height: 1.6;">This code will expire in 15 minutes.</p>
            <p style="color: #666; line-height: 1.6;">If you didn't request a password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">This email was sent by Yelstar.</p>
          </div>
        `,
      });

      // Update rate limit
      attemptData.count++;
      emailAttempts.set(email, attemptData);

      return NextResponse.json({
        message: 'Recovery code has been sent to your email'
      });

    } catch (error) {
      logger.error("Error in password reset process", {
        error,
        email,
        timestamp: new Date().toISOString(),
      });

      if (error instanceof Error) {
        if (error.message.includes("database")) {
          return NextResponse.json(
            { error: 'Error saving recovery code' },
            { status: 500 }
          );
        }
        if (error.message.includes("email")) {
          return NextResponse.json(
            { error: 'Error sending email' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Error processing request' },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error("Error in forgot-password endpoint", {
      error,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    );
  }
} 