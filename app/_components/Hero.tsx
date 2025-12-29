// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileUp,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LandingPage() {
  return (
    <main className="w-full">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-40 -right-30 h-130 w-130 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between md:py-20">
          {/* Left */}
          <div className="flex max-w-2xl flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                AI Review Analyzer
              </Badge>
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Reliable scoring
              </Badge>
            </div>

            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
              Turn customer reviews into a single, reliable{" "}
              <span className="text-primary">1–10 product score</span>.
            </h1>

            <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Revix analyzes real consumer feedback (Amazon, Flipkart, or your own
              exported reviews) to generate sentiment insights, pros/cons, and an
              overall score you can trust.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/analyze">
                  Analyze reviews <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">View dashboard</Link>
              </Button>
            </div>

            <div className="flex flex-col gap-2 pt-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                No scraping required (CSV upload supported)
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Fast, consistent scoring
              </div>
            </div>
          </div>

          {/* Right (Preview Card) */}
          <div className="w-full max-w-xl">
            <Card className="overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border bg-background p-2">
                      <Image
                        src="/Images/Logo/logo_light.svg"
                        alt="Revix"
                        width={120}
                        height={32}
                        className="h-7 w-auto"
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">Sample Report</CardTitle>
                      <CardDescription>
                        How Revix summarizes customer reviews
                      </CardDescription>
                    </div>
                  </div>

                  <Badge className="gap-1">
                    <Star className="h-3.5 w-3.5" />
                    8.6/10
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <MiniStat label="Positive" value="72%" />
                  <MiniStat label="Neutral" value="18%" />
                  <MiniStat label="Negative" value="10%" />
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold">Top Pros</p>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      <li>• Great build quality</li>
                      <li>• Value for money</li>
                      <li>• Fast delivery</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold">Top Cons</p>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      <li>• Average battery backup</li>
                      <li>• Packaging issues in some cases</li>
                      <li>• App setup can be confusing</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <p className="font-semibold">Verdict</p>
                    <p className="text-muted-foreground">
                      Mostly positive. Strong quality and pricing; minor issues
                      around battery and packaging.
                    </p>
                  </div>

                  <Button asChild variant="outline" className="gap-2">
                    <Link href="/analyze">
                      Upload reviews <FileUp className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">Built for clarity and speed</p>
            <p className="text-sm text-muted-foreground">
              Analyze reviews, understand key issues, and decide confidently.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <TrustItem
              icon={<BarChart3 className="h-4 w-4" />}
              title="Actionable insights"
              desc="Sentiment + pros/cons"
            />
            <TrustItem
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Consistent scoring"
              desc="1–10 score with confidence"
            />
            <TrustItem
              icon={<Sparkles className="h-4 w-4" />}
              title="Professional reports"
              desc="Dashboard-ready output"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 md:py-20">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-primary">Features</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to summarize product reviews
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Revix is designed for a clean workflow: upload reviews, analyze,
              and get a report that’s easy to understand and share.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<FileUp className="h-5 w-5" />}
              title="CSV upload (MVP-friendly)"
              desc="Upload exported reviews and generate reports instantly—no scraping required."
            />
            <FeatureCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="Sentiment distribution"
              desc="See positive/neutral/negative breakdown with confidence levels."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="1–10 trust score"
              desc="A clear overall rating computed from weighted sentiment + review signals."
            />
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Pros & cons summary"
              desc="Auto-generated highlights to quickly understand what buyers liked and disliked."
            />
            <FeatureCard
              icon={<Star className="h-5 w-5" />}
              title="Aspect insights (optional)"
              desc="Quality, delivery, price, packaging and more—based on review text."
            />
            <FeatureCard
              icon={<ArrowRight className="h-5 w-5" />}
              title="Shareable reports"
              desc="Save reports to dashboard and export later (PDF export can be added)."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 md:py-20">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-primary">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to a clear buying decision
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Keep it simple: provide reviews, run analysis, and read a clean report.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <StepCard
              step="01"
              title="Add reviews"
              desc="Upload a CSV of reviews or paste review text (URL import can be added later)."
            />
            <StepCard
              step="02"
              title="Analyze with AI"
              desc="Revix cleans text, detects sentiment, and extracts key pros/cons."
            />
            <StepCard
              step="03"
              title="Get a report"
              desc="View 1–10 score, confidence, sentiment breakdown, and a clear verdict."
            />
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/analyze">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Request a demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 md:py-20">
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col gap-6 p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-primary">Ready to build with Revix?</p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Start analyzing reviews and generate your first report.
                </h3>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Upload reviews, get a score, and keep everything organized in your dashboard.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/analyze">
                    Analyze now <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/signup">Create account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

/* ----------------- UI Bits ----------------- */

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function TrustItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-md border bg-background p-2 text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border bg-muted/40 p-2 text-muted-foreground">
            {icon}
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription className="mt-2">{desc}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function StepCard({
  step,
  title,
  desc,
}: {
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <p className="text-sm font-semibold text-primary">{step}</p>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
