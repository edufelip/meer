type DashboardHeroProps = {
  title: string;
  description: string;
};

export function DashboardHero({ title, description }: DashboardHeroProps) {
  return (
    <div className="text-center">
      <h2 className="font-display text-3xl md:text-4xl font-bold text-textDark tracking-tight">{title}</h2>
      <p className="mt-3 text-lg text-textSubtle max-w-2xl mx-auto">{description}</p>
    </div>
  );
}
