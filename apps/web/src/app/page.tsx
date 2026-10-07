import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { routes } from "@/config/site";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border px-6 h-14 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href={routes.login}>
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href={routes.signup}>
            <Button size="sm">Get started free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 space-y-6">
        <div className="space-y-3 max-w-2xl">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Watch together,
            <br />
            <span className="text-primary">perfectly in sync.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Create rooms, invite friends, and stream YouTube, Spotify, or Drive
            — all in real time, across every device.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href={routes.signup}>
            <Button size="lg">Start watching free</Button>
          </Link>
          <Link href={routes.login}>
            <Button size="lg" variant="outline">Sign in</Button>
          </Link>
        </div>

        {/* Platform pills */}
        <div className="flex flex-wrap gap-2 justify-center pt-4">
          {["🎬 YouTube", "🎵 Spotify", "📁 Google Drive", "🌐 Web"].map((p) => (
            <span
              key={p}
              className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm border border-border"
            >
              {p}
            </span>
          ))}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-3xl w-full text-left">
          {[
            { emoji: "⚔️", title: "Guild System", desc: "Form squads of up to 10. Compete for the top of the weekly guild leaderboard." },
            { emoji: "🎮", title: "Earn XP & Level Up", desc: "Watch, chat, and complete events to earn XP and climb to Level 10." },
            { emoji: "🏆", title: "Collectable Badges", desc: "Complete events to earn rare badges and decorate your profile." },
          ].map((f) => (
            <div
              key={f.title}
              className="p-4 rounded-xl border border-border bg-card space-y-1.5"
            >
              <span className="text-2xl">{f.emoji}</span>
              <h3 className="font-semibold text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}