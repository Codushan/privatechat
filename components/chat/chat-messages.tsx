"use client";

import React, { useEffect, useRef } from "react";
import { useChat } from "./chat-context";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { CheckCheck, Check, Image, File, Film, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMessage } from "@/lib/models/message";

export default function ChatMessages() {
  const { messages, isLoading, currentUser, otherUser, otherUserTyping, markAsRead } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unreadMessagesRef = useRef<string[]>([]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserTyping]);
  
  // Mark messages from other user as read
  useEffect(() => {
    if (messages.length > 0 && currentUser) {
      const unreadMessages = messages
        .filter(msg => msg.sender !== currentUser.userId && !msg.read)
        .map(msg => msg._id);
        
      if (unreadMessages.length > 0 && 
          JSON.stringify(unreadMessages) !== JSON.stringify(unreadMessagesRef.current)) {
        unreadMessagesRef.current = unreadMessages;
        markAsRead(unreadMessages);
      }
    }
  }, [messages, currentUser, markAsRead]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }
  
  const renderMessageContent = (message: IMessage) => {
    switch(message.contentType) {
      case 'image':
        return (
          <div className="relative rounded-lg overflow-hidden bg-muted max-w-xs">
            <img 
              src={message.fileUrl} 
              alt={message.fileName || "Image"} 
              className="max-w-full max-h-60 object-contain"
              loading="lazy"
            />
            {message.fileName && (
              <div className="p-2 bg-background/80 text-xs truncate">
                {message.fileName}
              </div>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div className="rounded-lg overflow-hidden bg-muted">
            <video 
              src={message.fileUrl} 
              controls 
              className="max-w-full max-h-60"
            >
              Your browser does not support video playback.
            </video>
            {message.fileName && (
              <div className="p-2 bg-background/80 text-xs truncate">
                {message.fileName}
              </div>
            )}
          </div>
        );
        
      case 'document':
        return (
          <a 
            href={message.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <FileText className="h-8 w-8 text-blue-500 mr-3" />
            <div className="overflow-hidden">
              <p className="font-medium truncate">{message.fileName || "Document"}</p>
              {message.fileSize && (
                <p className="text-xs text-muted-foreground">
                  {(message.fileSize / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </a>
        );
        
      case 'gif':
        return (
          <div className="rounded-lg overflow-hidden bg-muted">
            <img 
              src={message.fileUrl} 
              alt={message.fileName || "GIF"} 
              className="max-w-full max-h-60"
            />
          </div>
        );
        
      default:
        return <p>{message.content}</p>;
    }
  };
  
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toLocaleDateString();
    
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(message);
    return groups;
  }, {} as Record<string, IMessage[]>);
  
  return (
    <div className="h-full overflow-y-auto p-4 bg-background/50">
      {Object.keys(groupedMessages).map(date => (
        <div key={date}>
          <div className="flex justify-center mb-4 mt-8 first:mt-0">
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {date === new Date().toLocaleDateString() 
                ? "Today" 
                : date === new Date(Date.now() - 86400000).toLocaleDateString()
                  ? "Yesterday"
                  : date}
            </span>
          </div>
          
          {groupedMessages[date].map((message, index) => {
            const isCurrentUser = message.sender === currentUser?.userId;
            
            return (
              <motion.div
                key={message._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 500,
                  damping: 50,
                  mass: 1
                }}
                className={cn(
                  "flex mb-4", 
                  isCurrentUser ? "justify-end" : "justify-start"
                )}
              >
                <div 
                  className={cn(
                    "max-w-[75%] md:max-w-[60%] rounded-lg p-3",
                    isCurrentUser 
                      ? "bg-primary text-primary-foreground rounded-br-none" 
                      : "bg-card rounded-bl-none"
                  )}
                >
                  {renderMessageContent(message)}
                  
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] opacity-70">
                      {format(new Date(message.timestamp), "h:mm a")}
                    </span>
                    
                    {isCurrentUser && (
                      <span className="ml-1">
                        {message.read ? (
                          <CheckCheck className="h-3 w-3 text-blue-400" />
                        ) : (
                          <Check className="h-3 w-3 opacity-70" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
      
      {/* Typing indicator */}
      <AnimatePresence>
        {otherUserTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center mb-4"
          >
            <div className="bg-muted rounded-full px-4 py-2 text-sm flex items-center">
              <div className="flex space-x-1 mr-2">
                <motion.span 
                  className="w-2 h-2 bg-primary rounded-full inline-block"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ 
                    duration: 0.6, 
                    repeat: Infinity,
                    delay: 0 
                  }}
                />
                <motion.span 
                  className="w-2 h-2 bg-primary rounded-full inline-block"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ 
                    duration: 0.6, 
                    repeat: Infinity,
                    delay: 0.2
                  }}
                />
                <motion.span 
                  className="w-2 h-2 bg-primary rounded-full inline-block"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ 
                    duration: 0.6, 
                    repeat: Infinity,
                    delay: 0.4
                  }}
                />
              </div>
              {otherUser?.name} is typing...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div ref={messagesEndRef} />
    </div>
  );
}