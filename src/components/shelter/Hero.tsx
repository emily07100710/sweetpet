import heroImg from "@/assets/hero-illustration.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--color-warm-glow),_transparent_60%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            全台公益串聯 · 開源系統
          </span>
          <h1 className="mt-5 font-display text-5xl leading-tight tracking-tight text-foreground md:text-6xl">
            用科技
            <span className="text-primary">點亮微光</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
            全台毛孩物資 AI 智能媒合平台，將您手中的善意，精準送往最需要的收容所。
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div>
              <div className="text-2xl font-semibold text-foreground">22</div>
              縣市覆蓋
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">32</div>
              合作收容所
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">100%</div>
              開源公益
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-4 -z-10 rounded-[2.5rem] bg-secondary/60 blur-2xl" />
          <img
            src={heroImg}
            alt="毛孩與物資捐贈插畫"
            width={1280}
            height={1024}
            className="w-full rounded-[2rem] border border-border/60 bg-card shadow-warm"
          />
        </div>
      </div>
    </section>
  );
}
