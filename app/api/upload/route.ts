import { NextRequest, NextResponse } from "next/server";

// Function to handle file uploads
// For this implementation, we'll use base64 encoding directly
// In production, you would likely use Cloudinary or similar
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert to base64
    const base64String = buffer.toString("base64");
    const fileType = file.type;
    const fileName = file.name;
    const fileSize = file.size;
    
    // Construct data URL
    const dataUrl = `data:${fileType};base64,${base64String}`;
    
    return NextResponse.json({
      success: true,
      fileUrl: dataUrl,
      fileName,
      fileSize,
      contentType: getContentType(fileType),
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "File upload failed" },
      { status: 500 }
    );
  }
}

function getContentType(mimeType: string): "image" | "video" | "document" | "gif" {
  if (mimeType.startsWith("image/")) {
    if (mimeType === "image/gif") return "gif";
    return "image";
  } else if (mimeType.startsWith("video/")) {
    return "video";
  } else {
    return "document";
  }
}