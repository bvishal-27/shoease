// Shows 1 to 5 stars. If onChange is given, the stars become clickable (for forms).
export default function StarRating({ value = 0, onChange, className = "" }) {
  return (
    <span
      className={`inline-flex ${className}`}
      aria-label={`${Number(value).toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const star = (
          <span className={filled ? "text-yellow-500" : "text-muted-foreground/40"}>
            ★
          </span>
        );

        if (!onChange) return <span key={n}>{star}</span>;

        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="cursor-pointer text-2xl leading-none"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            {star}
          </button>
        );
      })}
    </span>
  );
}