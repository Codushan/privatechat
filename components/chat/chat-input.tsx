"use client";

import { useState, useRef } from "react";
import { useChat } from "./chat-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Smile, 
  Paperclip, 
  Send, 
  Image as ImageIcon,
  Film, 
  FileText,
  X 
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import { useDropzone } from "react-dropzone";

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <div className="p-4">Loading emoji picker...</div>
});

export default function ChatInput() {
  const { sendMessage, setIsTyping } = useChat();
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    type: string;
    url: string;
    name: string;
    size: number;
  } | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSendMessage = async () => {
    if ((!message && !previewFile) || isUploading) return;
    
    try {
      if (previewFile) {
        await sendMessage(
          message || previewFile.name, 
          previewFile.type, 
          previewFile.url, 
          previewFile.name, 
          previewFile.size
        );
        setPreviewFile(null);
      } else {
        await sendMessage(message, 'text');
      }
      
      setMessage("");
      inputRef.current?.focus();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: "Please try again later.",
      });
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleEmojiSelect = (emojiData: { emoji: string }) => {
    setMessage(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };
  
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 10MB.",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      const data = await response.json();
      
      setPreviewFile({
        type: data.contentType,
        url: data.fileUrl,
        name: data.fileName,
        size: data.fileSize,
      });
      
      toast({
        title: "File uploaded",
        description: "Your file is ready to send.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });
  
  const cancelFileUpload = () => {
    setPreviewFile(null);
  };
  
  const renderPreview = () => {
    if (!previewFile) return null;
    
    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="p-3 bg-muted rounded-lg mb-2 relative"
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 hover:bg-background"
          onClick={cancelFileUpload}
        >
          <X className="h-3 w-3" />
        </Button>
        
        <div className="flex items-center">
          {previewFile.type === 'image' && (
            <div className="w-14 h-14 bg-background/50 rounded flex items-center justify-center overflow-hidden mr-3">
              <img 
                src={previewFile.url} 
                alt="Preview" 
                className="max-w-full max-h-full object-contain" 
              />
            </div>
          )}
          
          {previewFile.type === 'video' && (
            <div className="w-14 h-14 bg-background/50 rounded flex items-center justify-center mr-3">
              <Film className="h-8 w-8 text-primary/70" />
            </div>
          )}
          
          {(previewFile.type === 'document' || previewFile.type === 'gif') && (
            <div className="w-14 h-14 bg-background/50 rounded flex items-center justify-center mr-3">
              <FileText className="h-8 w-8 text-primary/70" />
            </div>
          )}
          
          <div className="overflow-hidden flex-1">
            <p className="font-medium text-sm truncate">{previewFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(previewFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
      </motion.div>
    );
  };
  
  return (
    <div {...getRootProps()} className="p-3 border-t border-border bg-card">
      <input {...getInputProps()} />
      
      <AnimatePresence>
        {previewFile && renderPreview()}
      </AnimatePresence>
      
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 flex items-center justify-center z-50"
          >
            <div className="p-8 border-2 border-dashed border-primary rounded-lg text-center">
              <ImageIcon className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium">Drop your file here</h3>
              <p className="text-sm text-muted-foreground">
                Support images, videos, GIFs and documents (up to 10MB)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" side="top" align="start">
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                width="100%"
                height="350px"
              />
            </PopoverContent>
          </Popover>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => {
                open();
                inputRef.current?.focus();
              }}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                open();
                inputRef.current?.focus();
              }}>
                <Film className="h-4 w-4 mr-2" />
                Video
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                open();
                inputRef.current?.focus();
              }}>
                <FileText className="h-4 w-4 mr-2" />
                Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Input
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          className="flex-1"
          disabled={isUploading}
        />
        
        <Button 
          onClick={handleSendMessage} 
          size="icon"
          disabled={(!message && !previewFile) || isUploading}
          className={cn(
            "rounded-full",
            (!message && !previewFile) ? "opacity-50" : ""
          )}
        >
          {isUploading ? (
            <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Helper function to conditionally join class names
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};