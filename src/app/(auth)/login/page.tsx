"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/language-context";
import { LogIn } from "lucide-react";

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  password: yup
    .string()
    .max(128, "Password must be at most 128 characters")
    .required("Password is required"),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useLanguage();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await adminAuth.login(data.email, data.password);
      // Discard cached pages from any previous administrator session.
      window.location.replace("/dashboard");
    } catch (error) {
      setFormError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Sign-in failed. Please try again.",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="mb-4 flex items-center justify-center">
          <div className="rounded-full bg-primary p-3">
            <LogIn className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-center text-2xl">
          Choicestakes Admin
        </CardTitle>
        <CardDescription className="text-center">
          Sign in with your administrator account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {errors.root && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {errors.root.message}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.login.email}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              maxLength={254}
              disabled={isSubmitting}
              placeholder="admin@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t.auth.login.password}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              maxLength={128}
              disabled={isSubmitting}
              placeholder={t.auth.login.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t.auth.login.signingIn : t.auth.login.signIn}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Access is limited to authorized administrators. Contact your
            platform owner if you need an account.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
