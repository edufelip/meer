type DashboardHeroProps = {
  title: string;
  description: string;
};

export function DashboardHero({ title, description }: DashboardHeroProps) {
  return (
    <div className="text-center">
      <h2 className="font-display text-3xl md:text-4xl font-bold text-[#f6fff9] tracking-tight">{title}</h2>
      <p className="mt-3 text-lg text-brand-muted max-w-2xl mx-auto">{description}</p>
    </div>
  );
}
