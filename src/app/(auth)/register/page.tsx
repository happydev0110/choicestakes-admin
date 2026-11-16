import { redirect } from "next/navigation";
// Administrators are provisioned by the operator CLI, never by public registration.
export default function RegisterPage() {
  redirect("/login");
}
