import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    // Delete all verification tokens
    await prisma.verificationToken.deleteMany({});
    
    // Delete all users
    await prisma.user.deleteMany({});

    return NextResponse.json({
      message: "دیتابیس با موفقیت پاک شد",
    });
  } catch (error) {
    console.error("Error in reset-db:", error);
    return NextResponse.json(
      { error: "خطا در پاک کردن دیتابیس" },
      { status: 500 }
    );
  }
} 