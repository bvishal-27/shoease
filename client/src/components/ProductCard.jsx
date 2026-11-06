import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/StarRating";
import { formatPrice } from "@/lib/format";

export default function ProductCard({ product }) {
  const outOfStock = product.stock === 0;

  return (
    <Link
      to={`/product/${product._id}`}
      className="group overflow-hidden rounded-xl border bg-card transition hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.images[0]?.url}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        {outOfStock && (
          <Badge variant="destructive" className="absolute left-2 top-2">
            Out of stock
          </Badge>
        )}
      </div>

      <div className="space-y-1 p-4">
        <p className="text-xs text-muted-foreground">
          {product.brand ? `${product.brand} · ` : ""}
          {product.category}
        </p>
        <h3 className="line-clamp-1 font-semibold">{product.name}</h3>
        <div className="flex items-center gap-2 text-sm">
          <StarRating value={product.rating} />
          <span className="text-muted-foreground">({product.numReviews})</span>
        </div>
        <p className="pt-1 text-lg font-bold">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}