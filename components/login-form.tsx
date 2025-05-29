"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";

const formSchema = z.object({
  password: z.string().min(1, "Password is required"),
  userId: z.enum(["user1", "user2"], {
    required_error: "Please select a user",
  }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      userId: "user1",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store user info in localStorage
        localStorage.setItem("userId", values.userId);
        localStorage.setItem("userName", values.userId === "user1" 
          ? process.env.NEXT_PUBLIC_USER1_NAME || "User 1" 
          : process.env.NEXT_PUBLIC_USER2_NAME || "User 2");
        
        toast({
          title: "Success",
          description: "You've successfully logged in.",
        });
        
        // Redirect to chat page
        router.push("/chat");
      } else {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: data.error || "Invalid password. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full p-6 bg-card">
      <div className="flex justify-center mb-6">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="user1" id="user1" />
                      <Label htmlFor="user1">User 1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="user2" id="user2" />
                      <Label htmlFor="user2">User 2</Label>
                    </div>
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Enter the shared password"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Enter Chat"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}