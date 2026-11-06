import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { getProducts, getCategories } from "@/api/productApi";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

const PAGE_SIZE = 8;

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  // The URL is the single source of truth for filters
  const keyword = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page")) || 1;

  // Text boxes keep their own state until the user submits
  const [searchText, setSearchText] = useState(keyword);
  const [minText, setMinText] = useState(minPrice);
  const [maxText, setMaxText] = useState(maxPrice);

  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({ products: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load the category list once
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Keep the text boxes in sync when the URL changes (back button, clear)
  useEffect(() => {
    setSearchText(keyword);
    setMinText(minPrice);
    setMaxText(maxPrice);
  }, [keyword, minPrice, maxPrice]);

  // Fetch products whenever the URL filters change
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    const params = Object.fromEntries(searchParams.entries());

    getProducts({ ...params, limit: PAGE_SIZE }, controller.signal)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (err.code === "ERR_CANCELED") return; // a newer request replaced this one
        setError(err.response?.data?.message || "Could not load products");
        setLoading(false);
      });

    // cancel the old request if filters change quickly
    return () => controller.abort();
  }, [searchParams]);

  // Update some filters in the URL. Any filter change goes back to page 1.
  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(changes).forEach(([key, value]) => {
      const isDefaultSort = key === "sort" && value === "newest";
      if (!value || isDefaultSort) next.delete(key);
      else next.set(key, value);
    });

    if (!("page" in changes)) next.delete("page");
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ keyword: searchText.trim() });
  };

  const applyPrice = () => {
    if (minText && maxText && Number(minText) > Number(maxText)) {
      return toast.error("Min price cannot be more than max price");
    }
    updateParams({ minPrice: minText, maxPrice: maxText });
  };

  const hasFilters = keyword || category || minPrice || maxPrice || sort !== "newest";

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search products (e.g. watch, shoes)..."
        />
        <Button type="submit">Search</Button>
      </form>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
        <div className="col-span-1 md:col-span-2">
          <Select
            value={category || "all"}
            onValueChange={(v) => updateParams({ category: v === "all" ? "" : v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1 md:col-span-2">
          <Select value={sort} onValueChange={(v) => updateParams({ sort: v })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          type="number"
          min="0"
          placeholder="Min ₹"
          value={minText}
          onChange={(e) => setMinText(e.target.value)}
        />
        <Input
          type="number"
          min="0"
          placeholder="Max ₹"
          value={maxText}
          onChange={(e) => setMaxText(e.target.value)}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={applyPrice}>
          Apply price
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
            Clear all filters
          </Button>
        )}
        {!loading && !error && (
          <span className="ml-auto text-sm text-muted-foreground">
            {data.total} product{data.total === 1 ? "" : "s"} found
          </span>
        )}
      </div>

      {/* Results */}
      <div className="mt-6">
        {error ? (
          <p className="py-16 text-center text-destructive">{error}</p>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : data.products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg font-medium">No products found</p>
            <p className="mt-1 text-muted-foreground">
              Try a different search or clear the filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {data.products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        pages={data.pages}
        onChange={(n) => {
          updateParams({ page: String(n) });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}