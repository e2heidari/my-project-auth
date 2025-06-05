import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Signup request body:", {
      ...body,
      password: "***" // Hide password in logs
    });

    const { businessName, email, password, verificationCode } = body;

    if (!businessName || !email || !password || !verificationCode) {
      console.log("Missing fields:", { businessName, email, password: !!password, verificationCode });
      return NextResponse.json(
        { error: "تمام فیلدها الزامی هستند" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("User already exists:", email);
      return NextResponse.json(
        { error: "این ایمیل قبلاً ثبت شده است. لطفاً وارد شوید یا از ایمیل دیگری استفاده کنید." },
        { status: 400 }
      );
    }

    // Verify the code
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: verificationCode,
        expires: {
          gt: new Date(),
        },
      },
    });

    if (!verificationToken) {
      console.log("Invalid verification code:", { email, verificationCode });
      return NextResponse.json(
        { error: "کد تایید نامعتبر یا منقضی شده است. لطفاً دوباره درخواست کد تایید کنید." },
        { status: 400 }
      );
    }

    try {
      // Hash the password
      const hashedPassword = await hash(password, 12);
      console.log("Password hashed successfully");

      // Create the user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          businessName,
        },
      });

      console.log("User created successfully:", { id: user.id, email: user.email });

      // Delete the verification token
      await prisma.verificationToken.delete({
        where: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      });

      console.log("Verification token deleted successfully");

      return NextResponse.json({
        message: "ثبت نام با موفقیت انجام شد",
        user: {
          id: user.id,
          email: user.email,
          businessName: user.name,
        },
      });
    } catch (dbError) {
      console.error("Database error details:", {
        name: dbError instanceof Error ? dbError.name : "Unknown",
        message: dbError instanceof Error ? dbError.message : "Unknown error",
        stack: dbError instanceof Error ? dbError.stack : undefined,
      });

      if (dbError instanceof Error && dbError.message.includes("Unique constraint failed")) {
        return NextResponse.json(
          { error: "این ایمیل قبلاً ثبت شده است. لطفاً وارد شوید یا از ایمیل دیگری استفاده کنید." },
          { status: 400 }
        );
      }

      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error("Error in signup:", error);
    
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      { error: "خطا در ثبت نام. لطفاً دوباره تلاش کنید." },
      { status: 500 }
    );
  }
} 