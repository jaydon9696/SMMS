import { Utensils } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/admin/login-form";

export const metadata = { title: "Owner sign in" };

export default function AdminLoginPage() {
  return (
    <main className="surface-grid grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Utensils className="size-4" />
            </span>
            Smart Mess
          </div>
          <ThemeToggle />
        </div>
        <Card className="shadow-xl shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in to manage today&apos;s service.
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
