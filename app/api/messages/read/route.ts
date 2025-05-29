import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Message from "@/lib/models/message";

// Mark messages as read
export async function POST(req: NextRequest) {
  try {
    const { messageIds } = await req.json();
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid message IDs" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const updateResult = await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { read: true } }
    );
    
    return NextResponse.json({
      success: true,
      updated: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating read status:", error);
    return NextResponse.json(
      { error: "Failed to update read status" },
      { status: 500 }
    );
  }
}