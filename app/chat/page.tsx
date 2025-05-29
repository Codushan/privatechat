"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatHeader from "@/components/chat/chat-header";
import ChatMessages from "@/components/chat/chat-messages";
import ChatInput from "@/components/chat/chat-input";
import { ChatProvider } from "@/components/chat/chat-context";

export default function ChatPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user is authorized
    const userId = localStorage.getItem("userId");
    
    if (!userId) {
      router.push("/");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <ChatProvider>
      <div className="flex flex-col h-screen bg-background">
        <ChatHeader />
        <div className="flex-1 overflow-hidden">
          <ChatMessages />
        </div>
        <ChatInput />
      </div>
    </ChatProvider>
  );
}