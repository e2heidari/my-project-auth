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

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400, headers }
      );
    }

    // Find the reset code
    const resetRequest = await prisma.passwordReset.findFirst({
      where: {
        email,
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetRequest) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400, headers }
      );
    }

    // Log the code verification
    logger.info("Recovery code verified", {
      email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "Code verified successfully"
    }, { headers });

  } catch (error) {
    logger.error("Error in verify-code endpoint", {
      error,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500, headers }
    );
  }
} 