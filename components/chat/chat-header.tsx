"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useChat } from "./chat-context";
import { 
  Moon, 
  Sun, 
  LogOut, 
  MoreVertical,
  Circle
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function ChatHeader() {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const { otherUser } = useChat();
  
  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    router.push("/");
  };
  
  return (
    <div className="border-b border-border p-4 flex items-center justify-between bg-card">
      <div className="flex items-center space-x-3">
        <div className="relative w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-lg font-semibold text-primary">
            {otherUser?.name?.charAt(0) || "?"}
          </span>
          
          {/* Online indicator */}
          {otherUser?.online && (
            <motion.div
              className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </div>
        
        <div className="flex flex-col">
          <span className="font-semibold">{otherUser?.name || "User"}</span>
          
          {otherUser?.online ? (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <Circle className="h-2 w-2 fill-green-500" /> Online
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {otherUser?.lastSeen 
                ? `Last seen ${formatDistanceToNow(new Date(otherUser.lastSeen), { addSuffix: true })}` 
                : "Offline"}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}