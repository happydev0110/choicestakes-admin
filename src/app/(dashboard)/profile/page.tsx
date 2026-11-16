"use client";
import { useAdmin } from "@/contexts/admin-auth-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function ProfilePage() {
  const admin = useAdmin();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Administrator profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Your administrator account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-name">Name</Label>
            <Input id="admin-name" value={admin.name} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input id="admin-email" value={admin.email} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-role">Role</Label>
            <Input id="admin-role" value="Administrator" readOnly />
          </div>
          <p className="text-sm text-muted-foreground">
            Contact your platform owner to update account details or reset your
            password.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
