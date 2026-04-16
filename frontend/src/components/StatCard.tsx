type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  accent: "sun" | "ocean" | "ink";
};

export function StatCard({ label, value, detail, accent }: StatCardProps) {
  return (
    <article className="stat-card" data-accent={accent}>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      <p className="stat-card__detail">{detail}</p>
    </article>
  );
}
