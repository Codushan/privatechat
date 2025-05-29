import { LoginForm } from '@/components/login-form';

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md p-6 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Private Chat</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the shared password to access the chat
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}