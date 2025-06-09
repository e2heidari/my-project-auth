import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

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
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'تمام فیلدها الزامی هستند' },
        { status: 400, headers }
      );
    }

    // Find the reset code
    const resetRequest = await prisma.passwordReset.findFirst({
      where: {
        email,
        code,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetRequest) {
      return NextResponse.json(
        { error: 'کد نامعتبر یا منقضی شده است' },
        { status: 400, headers }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    // Delete the used reset code
    await prisma.passwordReset.delete({
      where: { id: resetRequest.id }
    });

    return NextResponse.json({
      message: 'Password reset successful. Please sign in with your new password.'
    }, { headers });

  } catch (error) {
    console.error('Error in reset-password:', error);
    return NextResponse.json(
      { error: 'خطا در تغییر رمز عبور' },
      { status: 500, headers }
    );
  }
} 