export default function LoadingDots() {
  return (
    <span className="inline-flex gap-1 align-middle">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500/100"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </span>
  );
}
