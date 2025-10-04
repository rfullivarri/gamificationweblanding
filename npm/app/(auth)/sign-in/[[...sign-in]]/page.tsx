"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <SignIn appearance={{ elements: { rootBox: "shadow-2xl" } }} />
    </div>
  );
}
