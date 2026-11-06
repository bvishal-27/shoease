import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/StarRating";
import { getProductById, addReview } from "@/api/productApi";
import { formatDate, formatPrice } from "@/lib/format";

export default function ProductDetails() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [reload, setReload] = useState(0); // bump to refetch after a review

  // review form
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load the product
  useEffect(() => {
    let ignore = false;
    setLoading(true);

    getProductById(id)
      .then((p) => {
        if (ignore) return;
        setProduct(p);
        setNotFound(false);
      })
      .catch(() => {
        if (ignore) return;
        setProduct(null);
        setNotFound(true);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, reload]);

  // Show the first image again when we open a different product
  useEffect(() => {
    setActiveImage(0);
  }, [id]);

  // If the user already reviewed this product, prefill the form so they can edit it
  useEffect(() => {
    if (!product || !user) {
      setRating(0);
      setComment("");
      return;
    }
    const mine = product.reviews.find((r) => r.user === user._id);
    setRating(mine?.rating || 0);
    setComment(mine?.comment || "");
  }, [product, user]);

  const hasReviewed = Boolean(
    product && user && product.reviews.some((r) => r.user === user._id)
  );

  const handleReview = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error("Please select a star rating");
    if (!comment.trim()) return toast.error("Please write a comment");

    try {
      setSubmitting(true);
      const res = await addReview(id, { rating, comment: comment.trim() });
      toast.success(res.message || "Review saved");
      setReload((n) => n + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link to="/" className={`${buttonVariants()} mt-6`}>
          Back to shop
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock === 0;

  return (
    <div>
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to products
      </Link>

      {/* Top section: gallery + info */}
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border bg-muted">
            <img
              src={product.images[activeImage]?.url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={img.public_id}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-md border-2 ${
                    i === activeImage ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-muted-foreground">
            {product.brand ? `${product.brand} · ` : ""}
            {product.category}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>

          <div className="mt-2 flex items-center gap-2">
            <StarRating value={product.rating} className="text-lg" />
            <span className="text-sm text-muted-foreground">
              {product.numReviews > 0
                ? `${product.rating.toFixed(1)} (${product.numReviews} review${
                    product.numReviews === 1 ? "" : "s"
                  })`
                : "No reviews yet"}
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold">{formatPrice(product.price)}</p>
          <p className="text-xs text-muted-foreground">Inclusive of all taxes shown at checkout</p>

          <div className="mt-4">
            {outOfStock ? (
              <Badge variant="destructive">Out of stock</Badge>
            ) : product.stock <= 10 ? (
              <Badge variant="secondary">Only {product.stock} left</Badge>
            ) : (
              <Badge variant="secondary">In stock</Badge>
            )}
          </div>

          <p className="mt-6 whitespace-pre-line text-muted-foreground">
            {product.description}
          </p>

          <Button
            size="lg"
            className="mt-8 w-full md:w-auto"
            disabled={outOfStock}
            onClick={() => toast.info("Cart is built in Chapter 7")}
          >
            {outOfStock ? "Out of stock" : "Add to cart"}
          </Button>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Customer reviews</h2>

          {product.reviews.length === 0 ? (
            <p className="mt-4 text-muted-foreground">
              No reviews yet. Be the first to review this product.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {[...product.reviews].reverse().map((review) => (
                <li key={review._id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{review.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.updatedAt)}
                    </span>
                  </div>
                  <StarRating value={review.rating} />
                  <p className="mt-2 text-sm">{review.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            {hasReviewed ? "Edit your review" : "Write a review"}
          </h2>

          {user ? (
            <form onSubmit={handleReview} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Your rating</Label>
                <div>
                  <StarRating value={rating} onChange={setRating} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Your review</Label>
                <Textarea
                  id="comment"
                  rows={4}
                  maxLength={500}
                  placeholder="What did you like or dislike?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {comment.length}/500
                </p>
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : hasReviewed ? "Update review" : "Submit review"}
              </Button>
            </form>
          ) : (
            <p className="mt-4 text-muted-foreground">
              Please{" "}
              <Link
                to="/login"
                state={{ from: location.pathname }}
                className="font-medium text-foreground underline"
              >
                log in
              </Link>{" "}
              to write a review.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}