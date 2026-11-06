import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getCategories, getProductById } from "@/api/productApi";
import {
  createProduct,
  updateProduct,
  deleteProductImage,
} from "@/api/adminProductApi";

const MAX_IMAGES = 5;

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  brand: "",
  stock: "",
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [existingImages, setExistingImages] = useState([]); // already on the server
  const [files, setFiles] = useState([]); // new files chosen in this form
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  // Preview URLs for the new files, cleaned up when files change
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  // Category suggestions
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // In edit mode, load the product
  useEffect(() => {
    if (!isEdit) return;
    let ignore = false;

    getProductById(id)
      .then((p) => {
        if (ignore) return;
        setForm({
          name: p.name,
          description: p.description,
          price: String(p.price),
          category: p.category,
          brand: p.brand || "",
          stock: String(p.stock),
        });
        setExistingImages(p.images);
      })
      .catch(() => {
        if (ignore) return;
        toast.error("Product not found");
        navigate("/admin/products", { replace: true });
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const totalImages = existingImages.length + files.length;

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = ""; // lets the user pick the same file again later

    const images = picked.filter((f) => f.type.startsWith("image/"));
    if (images.length !== picked.length) toast.error("Only image files are allowed");

    const tooBig = images.filter((f) => f.size > 5 * 1024 * 1024);
    if (tooBig.length > 0) toast.error("Each image must be under 5 MB");
    const valid = images.filter((f) => f.size <= 5 * 1024 * 1024);

    const room = MAX_IMAGES - totalImages;
    if (valid.length > room) {
      toast.error(`A product can have at most ${MAX_IMAGES} images`);
    }
    setFiles((prev) => [...prev, ...valid.slice(0, Math.max(room, 0))]);
  };

  const removeNewFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Deletes an already-saved image on the server right away
  const removeExistingImage = async (image) => {
    if (existingImages.length <= 1) {
      return toast.error("A product must keep at least one image");
    }
    if (!window.confirm("Delete this image?")) return;

    try {
      setRemovingId(image.public_id);
      const updated = await deleteProductImage(id, image.public_id);
      setExistingImages(updated.images);
      toast.success("Image deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete image");
    } finally {
      setRemovingId(null);
    }
  };

  const validate = () => {
    if (!form.name.trim()) return "Please enter the product name";
    if (!form.description.trim()) return "Please enter a description";
    if (form.price === "" || Number(form.price) < 0) return "Enter a valid price";
    if (!form.category.trim()) return "Please enter a category";
    if (form.stock === "" || Number(form.stock) < 0 || !Number.isInteger(Number(form.stock))) {
      return "Stock must be a whole number (0 or more)";
    }
    if (totalImages === 0) return "Please add at least one image";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validate();
    if (error) return toast.error(error);

    const body = new FormData();
    body.append("name", form.name.trim());
    body.append("description", form.description.trim());
    body.append("price", form.price);
    body.append("category", form.category.trim());
    body.append("brand", form.brand.trim());
    body.append("stock", form.stock);
    files.forEach((file) => body.append("images", file)); // key must be "images"

    try {
      setSaving(true);
      if (isEdit) {
        await updateProduct(id, body);
        toast.success("Product updated");
      } else {
        await createProduct(body);
        toast.success("Product created");
      }
      navigate("/admin/products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin/products"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to products
      </Link>
      <h1 className="mt-2 text-2xl font-bold">
        {isEdit ? "Edit product" : "Add product"}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            maxLength={100}
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={5}
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              list="category-options"
              placeholder="Pick one or type a new one"
              value={form.category}
              onChange={handleChange}
              required
            />
            <datalist id="category-options">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Brand (optional)</Label>
            <Input
              id="brand"
              name="brand"
              value={form.brand}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Images */}
        <div className="space-y-3">
          <Label>
            Images ({totalImages}/{MAX_IMAGES})
          </Label>

          {(existingImages.length > 0 || files.length > 0) && (
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <div key={img.public_id} className="relative">
                  <img
                    src={img.url}
                    alt=""
                    className="h-24 w-24 rounded-lg border object-cover"
                  />
                  <button
                    type="button"
                    disabled={removingId === img.public_id}
                    onClick={() => removeExistingImage(img)}
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-xs text-white shadow"
                    aria-label="Delete image"
                  >
                    ×
                  </button>
                </div>
              ))}

              {previews.map((url, i) => (
                <div key={url} className="relative">
                  <img
                    src={url}
                    alt=""
                    className="h-24 w-24 rounded-lg border-2 border-dashed border-primary object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewFile(i)}
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-xs text-white shadow"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {totalImages < MAX_IMAGES && (
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
            />
          )}
          <p className="text-xs text-muted-foreground">
            Up to {MAX_IMAGES} images, 5 MB each. The first image is the main one.
            Dashed borders are new images that upload when you save.
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create product"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/products")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}