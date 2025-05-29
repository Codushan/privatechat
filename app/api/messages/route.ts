import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Message from "@/lib/models/message";
import User from "@/lib/models/user";
import { sendMessageNotification } from "@/lib/email";

// Get all messages
export async function GET() {
  try {
    await connectToDatabase();
    const messages = await Message.find({}).sort({ timestamp: 1 });
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// Create a new message
export async function POST(req: NextRequest) {
  try {
    const messageData = await req.json();
    await connectToDatabase();
    
    // Create new message
    const newMessage = new Message(messageData);
    await newMessage.save();
    
    // Check if recipient is offline - if so, send email notification
    // Only admin (user1) receives notifications
    if (messageData.sender !== "user1") {
      const admin = await User.findOne({ userId: "user1" });
      const sender = await User.findOne({ userId: messageData.sender });
      
      if (admin && sender && !admin.online) {
        await sendMessageNotification(newMessage, sender, admin);
      }
    }
    
    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}