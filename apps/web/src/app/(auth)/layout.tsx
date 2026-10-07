import { Logo } from "@/components/shared/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 border-r border-border flex-col justify-between p-12">
        <Logo />
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Watch together,
            <br />
            <span className="text-primary">perfectly in sync.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-sm">
            Join rooms, earn XP, climb leaderboards, and watch everything
            with your people — across every device.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>🎬 YouTube</span>
          <span>🎵 Spotify</span>
          <span>📁 Drive</span>
          <span>🌐 Web</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}