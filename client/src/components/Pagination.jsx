import { Button } from "@/components/ui/button";

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </Button>

      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Button
          key={n}
          size="sm"
          variant={n === page ? "default" : "outline"}
          onClick={() => onChange(n)}
        >
          {n}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}