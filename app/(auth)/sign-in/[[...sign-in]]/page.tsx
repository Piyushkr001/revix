"use client";

import * as React from "react";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
  return (
    <div className="relative min-h-screen w-full">
      {/* Background (light + dark) */}
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-blue-500/30 via-violet-500/20 to-emerald-500/20 dark:from-indigo-500/15 dark:via-purple-500/10 dark:to-emerald-500/10" />
      <div className="absolute inset-0 -z-20 bg-background" />

      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-2 md:items-center md:gap-12 md:px-6">
        {/* Left: Branding / Visual */}
        <div className="order-last flex flex-col items-center justify-center gap-5 md:order-first md:items-start">
          <h1 className="text-balance text-center text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-left md:text-4xl">
            Welcome to{" "}
            <span className="bg-linear-to-br from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Revix
            </span>
          </h1>

          <p className="max-w-md text-center text-sm text-muted-foreground md:text-left">
            Sign in to access your dashboard, saved reports, and analytics.
          </p>

          {/* Image card */}
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-background/60 shadow-sm backdrop-blur dark:bg-background/40 dark:shadow-black/20">
            <div className="p-3">
              <Image
                src="/Images/SignIn.png"
                alt="Revix sign in"
                width={900}
                height={700}
                priority
                className="h-auto w-full rounded-xl object-cover"
              />
            </div>
          </div>

          {/* Small trust line */}
          <p className="text-xs text-muted-foreground">
            Secure authentication powered by Clerk.
          </p>
        </div>

        {/* Right: Clerk SignIn */}
        <div className="order-first flex items-center justify-center md:order-last">
          <div className="w-full max-w-md">
            {/* Wrapper card so it looks good in both themes */}
            <div className="rounded-2xl border bg-background/70 p-4 shadow-sm backdrop-blur dark:bg-background/50 dark:shadow-black/20 sm:p-6">
              <SignIn
                appearance={{
                  variables: {
                    borderRadius: "12px",
                  },
                  elements: {
                    card: "shadow-none bg-transparent border-0",
                    headerTitle: "text-foreground",
                    headerSubtitle: "text-muted-foreground",
                    socialButtonsBlockButton:
                      "border-border bg-background hover:bg-accent text-foreground",
                    dividerLine: "bg-border",
                    dividerText: "text-muted-foreground",
                    formFieldLabel: "text-foreground",
                    formFieldInput:
                      "bg-background border-border text-foreground focus:ring-2 focus:ring-primary",
                    footerActionText: "text-muted-foreground",
                    footerActionLink: "text-primary hover:text-primary/90",
                    formButtonPrimary:
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
