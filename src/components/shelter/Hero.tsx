import heroBackground from "@/assets/hero-background.jpg";

export function Hero() {
  return (
    <section className="relative min-h-[720px] overflow-hidden bg-background md:min-h-[760px]">
      <img
        src={heroBackground}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-[62%_center] md:object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/30" />
      <div className="relative mx-auto max-w-6xl px-6 pt-12 md:pt-20">
        <div className="max-w-xl">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            全台公益串聯 · 開源系統
          </span>
          <h1 className="mt-5 font-display text-5xl leading-tight tracking-tight text-foreground drop-shadow-sm md:text-6xl">
            用科技
            <span className="text-primary">點亮微光</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg font-medium leading-relaxed text-muted-foreground">
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
      </div>
    </section>
  );
}
