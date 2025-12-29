"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Linkedin } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InstagramLogoIcon, XLogoIcon } from "@phosphor-icons/react";

const footerLinks = {
  product: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Analyze", href: "/analyze" },
    { name: "Pricing", href: "/pricing" },
    { name: "Changelog", href: "/changelog" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
    { name: "Careers", href: "/careers" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Support", href: "/support" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        {/* Top */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="flex max-w-sm flex-col gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/Images/Logo/logo_light.svg"
                alt="Revix"
                width={150}
                height={40}
                className="h-9 w-auto"
                priority
              />
              <span className="sr-only">Revix</span>
            </Link>

            <p className="text-sm text-muted-foreground">
              Revix is an AI review analyzer that summarizes customer feedback and
              generates a reliable 1–10 product score so buyers can decide faster.
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/analyze">Start analyzing</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>

            {/* Social */}
            <div className="mt-3 flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild aria-label="Twitter">
                <Link href="https://twitter.com" target="_blank" rel="noreferrer">
                  <XLogoIcon className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="GitHub">
                <Link href="https://facebook.com" target="_blank" rel="noreferrer">
                  <Facebook className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="LinkedIn">
                <Link href="https://instagram.com" target="_blank" rel="noreferrer">
                  <InstagramLogoIcon className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="Email">
                <Link href="https://linkedin.com" target="_blank" rel="noreferrer">
                  <Linkedin className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-20 sm:grid-cols-3">
            <FooterColumn title="Product" links={footerLinks.product} />
            <FooterColumn title="Company" links={footerLinks.company} />
            <FooterColumn title="Legal" links={footerLinks.legal} />
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} Revix. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Quick links:</span>
            <Button asChild variant="ghost" size="sm" className="h-8 px-2">
              <Link href="/privacy">Privacy</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 px-2">
              <Link href="/terms">Terms</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 px-2">
              <Link href="/support">Support</Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { name: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{title}</p>
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.name}>
            <Link
              href={l.href}
              className={cn(
                "text-sm text-muted-foreground transition-colors hover:text-foreground"
              )}
            >
              {l.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
