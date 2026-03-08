import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, X, Shield, Upload, ImageIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/products";
import { useQueryClient } from "@tanstack/react-query";

const categories = ["t-shirts", "shorts", "hoodies", "accessories"];
const allSizes = ["XS", "S", "M", "L", "XL", "XXL"];

const emptyForm = {
  name: "",
  price: "",
  original_price: "",
  image_url: "",
  category: "t-shirts",
  colors: "",
  sizes: [] as string[],
  description: "",
  featured: false,
  is_new: false,
};

const AdminPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: products, isLoading: productsLoading } = useProducts();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check admin role via security definer function
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(!!data && !error);
      setCheckingRole(false);
    };
    if (!authLoading) checkAdmin();
  }, [user, authLoading]);

  if (authLoading || checkingRole) {
    return (
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container-brand text-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container-brand text-center py-20">
          <Shield size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h1 className="section-heading mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            You don't have permission to access this page.
          </p>
          <button onClick={() => navigate("/")} className="btn-primary">
            Go Home
          </button>
        </div>
      </main>
    );
  }

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { contentType: file.type });
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleEdit = (product: any) => {
    setForm({
      name: product.name,
      price: String(product.price),
      original_price: product.originalPrice ? String(product.originalPrice) : "",
      image_url: product.image,
      category: product.category,
      colors: product.colors.join(", "),
      sizes: product.sizes,
      description: product.description,
      featured: product.featured || false,
      is_new: product.new || false,
    });
    setEditingId(product.id);
    setShowForm(true);
    setImageFile(null);
    setImagePreview(product.image);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product deleted" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const productData = {
      name: form.name,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      image_url: form.image_url,
      category: form.category,
      colors: form.colors.split(",").map((c) => c.trim()).filter(Boolean),
      sizes: form.sizes,
      description: form.description,
      featured: form.featured,
      is_new: form.is_new,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("products").update(productData).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Product updated" });
      } else {
        const { error } = await supabase.from("products").insert(productData);
        if (error) throw error;
        toast({ title: "Product created" });
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      resetForm();
    } catch (error) {
      toast({
        title: "Error saving product",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSizeToggle = (size: string) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  return (
    <main className="pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="container-brand max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="section-heading mb-2">Admin — Products</h1>
            <p className="text-muted-foreground text-sm">Manage your product catalog</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <Plus size={18} />
              Add Product
            </button>
          )}
        </div>

        {/* Product Form */}
        {showForm && (
          <div className="border border-border p-6 mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg tracking-wider uppercase">
                {editingId ? "Edit Product" : "New Product"}
              </h2>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-display text-xs tracking-widest uppercase mb-2 block">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    className="input-brand"
                  />
                </div>
                <div>
                  <label className="font-display text-xs tracking-widest uppercase mb-2 block">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="input-brand"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-display text-xs tracking-widest uppercase mb-2 block">Price (ZAR)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    required
                    min="0"
                    className="input-brand"
                  />
                </div>
                <div>
                  <label className="font-display text-xs tracking-widest uppercase mb-2 block">Original Price (optional)</label>
                  <input
                    type="number"
                    value={form.original_price}
                    onChange={(e) => setForm((p) => ({ ...p, original_price: e.target.value }))}
                    min="0"
                    className="input-brand"
                  />
                </div>
              </div>

              <div>
                <label className="font-display text-xs tracking-widest uppercase mb-2 block">Image URL</label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                  required
                  placeholder="/products/my-image.jpeg"
                  className="input-brand"
                />
              </div>

              <div>
                <label className="font-display text-xs tracking-widest uppercase mb-2 block">Colors (comma-separated)</label>
                <input
                  type="text"
                  value={form.colors}
                  onChange={(e) => setForm((p) => ({ ...p, colors: e.target.value }))}
                  placeholder="Black, White"
                  className="input-brand"
                />
              </div>

              <div>
                <label className="font-display text-xs tracking-widest uppercase mb-2 block">Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {allSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeToggle(size)}
                      className={`w-12 h-10 border font-display text-sm tracking-wider transition-all ${
                        form.sizes.includes(size)
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-display text-xs tracking-widest uppercase mb-2 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="input-brand resize-none"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="font-display text-xs tracking-widest uppercase">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_new}
                    onChange={(e) => setForm((p) => ({ ...p, is_new: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="font-display text-xs tracking-widest uppercase">New Arrival</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? "Saving..." : editingId ? "Update Product" : "Create Product"}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        {productsLoading ? (
          <p className="text-muted-foreground">Loading products...</p>
        ) : !products?.length ? (
          <p className="text-muted-foreground">No products yet. Add your first product above.</p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="border border-border p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-secondary flex-shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm tracking-wide truncate">{product.name}</h3>
                    {product.new && (
                      <span className="text-[10px] font-display tracking-widest uppercase px-2 py-0.5 bg-foreground text-background">New</span>
                    )}
                    {product.featured && (
                      <span className="text-[10px] font-display tracking-widest uppercase px-2 py-0.5 bg-secondary text-secondary-foreground">Featured</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">{product.category} · {formatPrice(product.price)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminPage;
