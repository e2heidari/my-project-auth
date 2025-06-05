import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import logger from "@/lib/logger";

export async function POST(request: Request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }

  try {
    const { email, code } = await request.json();
    console.log("Verifying code for:", { email, code });

    if (!email || !code) {
      return NextResponse.json(
        { error: "ایمیل و کد تایید الزامی هستند" },
        { status: 400, headers }
      );
    }

    // Check both verificationToken and passwordReset tables
    const [verificationToken, passwordReset] = await Promise.all([
      prisma.verificationToken.findFirst({
        where: {
          identifier: email,
          token: code,
          expires: {
            gt: new Date(),
          },
        },
      }),
      prisma.passwordReset.findFirst({
        where: {
          email,
          code,
          expiresAt: {
            gt: new Date(),
          },
        },
      }),
    ]);

    if (!verificationToken && !passwordReset) {
      console.log("Invalid or expired code:", { email, code });
      return NextResponse.json(
        { error: "کد تایید نامعتبر یا منقضی شده است" },
        { status: 400, headers }
      );
    }

    // Log the code verification
    logger.info("Verification code verified", {
      email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "کد تایید با موفقیت تایید شد"
    }, { headers });

  } catch (error) {
    logger.error("Error in verify-code endpoint", {
      error,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "خطا در تایید کد" },
      { status: 500, headers }
    );
  }
} 