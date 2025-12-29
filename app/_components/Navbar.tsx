"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import { ModeToggle } from "@/components/ModeToggle";

// ✅ Clerk
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        "border-b border-border/60",
        "bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/60",
        "md:rounded-2xl",
        "shadow-sm dark:shadow-black/20"
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/Images/Logo/logo_light.svg"
            alt="Revix"
            width={140}
            height={40}
            priority
            className="h-14 w-auto dark:hidden"
          />
          <Image
            src="/Images/Logo/logo_dark.svg"
            alt="Revix"
            width={140}
            height={40}
            priority
            className="hidden h-14 w-auto dark:block"
          />
          <span className="sr-only">Revix</span>
        </Link>

        {/* Center: Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "text-foreground/80 hover:text-foreground",
                  "hover:bg-accent/70",
                  active &&
                    "bg-accent text-accent-foreground shadow-sm dark:shadow-black/20"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right: Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">
          <ModeToggle />

          {/* ✅ If Signed Out: show Login + Sign up */}
          <SignedOut>
            <Button asChild variant="ghost">
              <Link href="/sign-in">Login</Link>
            </Button>
            <Button asChild className="shadow-sm dark:shadow-black/20">
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </SignedOut>

          {/* ✅ If Signed In: hide Login/Sign up and show UserButton */}
          <SignedIn>
            <div className="flex items-center gap-2">
              {/* Optional: Dashboard shortcut */}
              <Button asChild variant="ghost">
                <Link href="/dashboard">Dashboard</Link>
              </Button>

              <div className="rounded-full border border-border/60 bg-background/60 p-1 shadow-sm dark:shadow-black/20">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-8 w-8",
                    },
                  }}
                />
              </div>
            </div>
          </SignedIn>
        </div>

        {/* Mobile: Actions + Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />

          {/* ✅ On mobile: if SignedOut show Login, if SignedIn show UserButton */}
          <SignedOut>
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Login</Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <div className="rounded-full border border-border/60 bg-background/60 p-1 shadow-sm dark:shadow-black/20">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: { userButtonAvatarBox: "h-8 w-8" },
                }}
              />
            </div>
          </SignedIn>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className={cn("w-[320px] sm:w-95", "bg-background text-foreground")}
            >
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Image
                    src="/Images/Logo/logo_light.svg"
                    alt="Revix"
                    width={120}
                    height={32}
                    className="h-8 w-auto dark:hidden"
                  />
                  <Image
                    src="/Images/Logo/logo_dark.svg"
                    alt="Revix"
                    width={120}
                    height={32}
                    className="hidden h-8 w-auto dark:block"
                  />
                  <span className="sr-only">Revix</span>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-2">
                {navLinks.map((link) => {
                  const active =
                    link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        "text-foreground/80 hover:text-foreground",
                        "hover:bg-accent/70",
                        active &&
                          "bg-accent text-accent-foreground shadow-sm dark:shadow-black/20"
                      )}
                    >
                      {link.name}
                    </Link>
                  );
                })}

                <Separator className="my-3" />

                {/* ✅ Mobile Auth Buttons inside drawer */}
                <SignedOut>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    <Link href="/sign-in">Login</Link>
                  </Button>

                  <Button asChild className="w-full" onClick={() => setOpen(false)}>
                    <Link href="/sign-up">Sign up</Link>
                  </Button>
                </SignedOut>

                <SignedIn>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>

                  {/* Optional: show user button in drawer too */}
                  <div className="mt-1 flex justify-start">
                    <div className="rounded-full border border-border/60 bg-background/60 p-1 shadow-sm dark:shadow-black/20">
                      <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                          elements: { userButtonAvatarBox: "h-8 w-8" },
                        }}
                      />
                    </div>
                  </div>
                </SignedIn>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
