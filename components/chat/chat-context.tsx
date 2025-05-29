"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { IMessage } from "@/lib/models/message";
import { useToast } from "@/hooks/use-toast";

interface User {
  userId: string;
  name: string;
  online: boolean;
  lastSeen?: Date;
}

interface ChatContextType {
  messages: IMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, contentType: string, fileUrl?: string, fileName?: string, fileSize?: number) => Promise<void>;
  currentUser: User | null;
  otherUser: User | null;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  markAsRead: (messageIds: string[]) => Promise<void>;
  otherUserTyping: boolean;
}

const ChatContext = createContext<ChatContextType>({
  messages: [],
  isLoading: false,
  error: null,
  sendMessage: async () => {},
  currentUser: null,
  otherUser: null,
  isTyping: false,
  setIsTyping: () => {},
  markAsRead: async () => {},
  otherUserTyping: false,
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const { toast } = useToast();

  // Typing indicator debounce
  useEffect(() => {
    if (!socket) return;
    
    let typingTimer: NodeJS.Timeout;
    
    if (isTyping) {
      socket.emit("typing", { userId: currentUser?.userId, isTyping: true });
      
      // Clear the typing indicator after 2 seconds of no typing
      typingTimer = setTimeout(() => {
        setIsTyping(false);
        socket.emit("typing", { userId: currentUser?.userId, isTyping: false });
      }, 2000);
    } else {
      socket.emit("typing", { userId: currentUser?.userId, isTyping: false });
    }
    
    return () => {
      clearTimeout(typingTimer);
    };
  }, [isTyping, socket, currentUser]);

  // Initialize user data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName");
      
      if (userId && userName) {
        setCurrentUser({
          userId,
          name: userName,
          online: true,
        });
        
        // Set other user
        const otherUserId = userId === "user1" ? "user2" : "user1";
        const otherUserName = otherUserId === "user1" 
          ? process.env.NEXT_PUBLIC_USER1_NAME || "User 1"
          : process.env.NEXT_PUBLIC_USER2_NAME || "User 2";
          
        setOtherUser({
          userId: otherUserId,
          name: otherUserName,
          online: false, // We'll update this via socket
        });
        
        // Update user status to online
        fetch('/api/user-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, status: 'online' }),
        }).catch(err => console.error('Failed to update user status:', err));
      }
    }
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!currentUser) return;
    
    const initializeSocket = async () => {
      // Initialize the socket
      await fetch('/api/socket');
      
      const socketInstance = io({
        path: '/api/socket',
      });
      
      socketInstance.on('connect', () => {
        console.log('Socket connected!');
        socketInstance.emit('join-chat', currentUser.userId);
      });
      
      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Failed to connect to chat server. Please refresh.",
        });
      });
      
      setSocket(socketInstance);
      
      return socketInstance;
    };
    
    let socketInstance: Socket;
    initializeSocket().then(instance => {
      if (instance) socketInstance = instance;
    });
    
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [currentUser, toast]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket || !currentUser) return;
    
    // Handle new messages
    socket.on('receive-message', (message: IMessage) => {
      setMessages(prev => [...prev, message]);
      
      // If the message is from the other user, mark as read
      if (message.sender !== currentUser.userId) {
        markAsRead([message._id]);
      }
    });
    
    // Handle user status updates
    socket.on('user-status', ({ userId, status }: { userId: string, status: 'online' | 'offline' }) => {
      if (userId === otherUser?.userId) {
        setOtherUser(prev => prev ? {
          ...prev,
          online: status === 'online',
        } : null);
      }
    });
    
    // Handle typing indicators
    socket.on('user-typing', ({ userId, isTyping }: { userId: string, isTyping: boolean }) => {
      if (userId === otherUser?.userId) {
        setOtherUserTyping(isTyping);
      }
    });
    
    // Handle read receipts
    socket.on('messages-read', ({ userId, messageIds }: { userId: string, messageIds: string[] }) => {
      if (userId === otherUser?.userId) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            messageIds.includes(msg._id) ? { ...msg, read: true } : msg
          )
        );
      }
    });
    
    return () => {
      socket.off('receive-message');
      socket.off('user-status');
      socket.off('user-typing');
      socket.off('messages-read');
    };
  }, [socket, currentUser, otherUser]);

  // Load all messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/messages');
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try refreshing.');
        
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load messages. Please refresh the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser) {
      fetchMessages();
    }
  }, [currentUser, toast]);

  // Mark messages as read
  const markAsRead = async (messageIds: string[]) => {
    if (!socket || !currentUser || messageIds.length === 0) return;
    
    try {
      // Update messages locally
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
      
      // Emit read status to other user
      socket.emit('read-messages', { userId: currentUser.userId, messageIds });
      
      // Update in database
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageIds }),
      });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Send a message
  const sendMessage = async (
    content: string,
    contentType: string = 'text',
    fileUrl?: string,
    fileName?: string,
    fileSize?: number
  ) => {
    if (!socket || !currentUser) return;
    
    try {
      const newMessage: Partial<IMessage> = {
        sender: currentUser.userId,
        content,
        contentType: contentType as any,
        timestamp: new Date(),
        read: false,
      };
      
      // Add file info if present
      if (fileUrl) newMessage.fileUrl = fileUrl;
      if (fileName) newMessage.fileName = fileName;
      if (fileSize) newMessage.fileSize = fileSize;
      
      // Save message to database
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const savedMessage = await response.json();
      
      // Add to messages
      setMessages(prev => [...prev, savedMessage]);
      
      // Emit to socket
      socket.emit('send-message', savedMessage);
      
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again.",
      });
    }
  };

  // Update online status when window loses/gains focus
  useEffect(() => {
    if (!currentUser) return;
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User came back - set online
        fetch('/api/user-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: currentUser.userId, status: 'online' }),
        }).catch(err => console.error('Failed to update online status:', err));
      }
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [currentUser]);

  // Set offline status when leaving
  useEffect(() => {
    if (!currentUser) return;
    
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        '/api/user-status',
        JSON.stringify({ userId: currentUser.userId, status: 'offline' })
      );
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  const contextValue = {
    messages,
    isLoading,
    error,
    sendMessage,
    currentUser,
    otherUser,
    isTyping,
    setIsTyping,
    markAsRead,
    otherUserTyping,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};