import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/user";

// Update user status (online/offline)
export async function POST(req: NextRequest) {
  try {
    const { userId, status } = await req.json();
    await connectToDatabase();
    
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { 
        online: status === "online",
        ...(status === "online" ? { lastSeen: new Date() } : {}),
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}

// Get user status
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    const user = await User.findOne({ userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      userId: user.userId,
      name: user.name,
      online: user.online,
      lastSeen: user.lastSeen,
    });
  } catch (error) {
    console.error("Error fetching user status:", error);
    return NextResponse.json(
      { error: "Failed to fetch user status" },
      { status: 500 }
    );
  }
}