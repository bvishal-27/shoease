import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/Pagination";
import { getProducts } from "@/api/productApi";
import { deleteProduct } from "@/api/adminProductApi";
import { formatPrice } from "@/lib/format";

const PAGE_SIZE = 10;

export default function AdminProducts() {
  const [keyword, setKeyword] = useState("");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ products: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    getProducts({ keyword, page, limit: PAGE_SIZE }, controller.signal)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (err.code === "ERR_CANCELED") return;
        toast.error(err.response?.data?.message || "Could not load products");
        setLoading(false);
      });

    return () => controller.abort();
  }, [keyword, page, reload]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setKeyword(searchText.trim());
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This also deletes its images.`)) {
      return;
    }

    try {
      setDeletingId(product._id);
      await deleteProduct(product._id);
      toast.success("Product deleted");

      // if we deleted the last item on this page, go back one page
      if (data.products.length === 1 && page > 1) setPage(page - 1);
      else setReload((n) => n + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete product");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {data.total} product{data.total === 1 ? "" : "s"} in the store
          </p>
        </div>
        <Link to="/admin/products/new" className={buttonVariants()}>
          + Add product
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by name, brand or category..."
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
        {keyword && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchText("");
              setKeyword("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </form>

      <div className="mt-4 rounded-xl border">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data.products.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No products found.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.products.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>
                    <img
                      src={p.images[0]?.url}
                      alt={p.name}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.brand}</p>
                  </TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>{formatPrice(p.price)}</TableCell>
                  <TableCell>
                    {p.stock === 0 ? (
                      <Badge variant="destructive">Out of stock</Badge>
                    ) : p.stock <= 5 ? (
                      <Badge variant="secondary">{p.stock} (low)</Badge>
                    ) : (
                      p.stock
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/admin/products/${p._id}/edit`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Edit
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={deletingId === p._id}
                        onClick={() => handleDelete(p)}
                      >
                        {deletingId === p._id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Pagination page={page} pages={data.pages} onChange={setPage} />
    </div>
  );
}