export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/user";

export async function POST(req: NextRequest) {
  try {
    const { password, userId } = await req.json();
    
    // Verify password against environment variable
    const correctPassword = process.env.CHAT_PASSWORD;
    
    if (!correctPassword) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }
    
    if (password !== correctPassword) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Get user name based on userId
    const userName = userId === "user1" 
      ? process.env.NEXT_PUBLIC_USER1_NAME || "User 1"
      : process.env.NEXT_PUBLIC_USER2_NAME || "User 2";
      
    // Get email for the user (for notifications)
    const email = userId === "user1" && process.env.ADMIN_EMAIL
      ? process.env.ADMIN_EMAIL
      : "user@example.com"; // Default/placeholder

    // Update or create user in the database
    await User.findOneAndUpdate(
      { userId },
      { 
        userId,
        name: userName,
        email,
        lastSeen: new Date(),
        online: true,
        isAdmin: userId === "user1" // First user is admin
      },
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      user: {
        userId,
        name: userName,
      }
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}