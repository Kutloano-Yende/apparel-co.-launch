import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

const reviewSchema = z.object({
  rating: z.number().int().min(1, "Please select a rating").max(5),
  comment: z.string().trim().max(1000, "Comment must be 1000 characters or less"),
});

const StarRating = ({
  value,
  onChange,
  size = 18,
  readOnly = false,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
  readOnly?: boolean;
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            className={readOnly ? "cursor-default" : "cursor-pointer"}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              size={size}
              className={active ? "fill-foreground text-foreground" : "text-muted-foreground"}
            />
          </button>
        );
      })}
    </div>
  );
};

const ProductReviews = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userReview = user ? reviews.find((r) => r.user_id === user.id) : null;
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const loadReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    setReviews(data || []);
    setLoading(false);
  };

  const checkPurchase = async () => {
    if (!user) { setCanReview(false); return; }
    const { data } = await supabase.rpc("has_purchased_product", {
      _user_id: user.id,
      _product_id: productId,
    });
    setCanReview(!!data);
  };

  useEffect(() => {
    loadReviews();
    checkPurchase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user?.id]);

  const submitReview = async () => {
    if (!user) return;
    const parsed = reviewSchema.safeParse({ rating, comment });
    if (!parsed.success) {
      toast({ title: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").upsert(
      { product_id: productId, user_id: user.id, rating, comment: parsed.data.comment },
      { onConflict: "product_id,user_id" }
    );
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not save review", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: userReview ? "Review updated" : "Review posted" });
    setRating(0);
    setComment("");
    loadReviews();
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      toast({ title: "Could not delete", variant: "destructive" });
      return;
    }
    toast({ title: "Review deleted" });
    loadReviews();
  };

  // Pre-fill form if editing existing review
  useEffect(() => {
    if (userReview && rating === 0 && !comment) {
      setRating(userReview.rating);
      setComment(userReview.comment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userReview?.id]);

  return (
    <section className="mt-16 pt-12 border-t border-border">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <StarRating value={Math.round(avgRating)} readOnly size={16} />
              <span className="text-sm text-muted-foreground">
                {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Review form */}
      {user && canReview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-6 border border-border bg-secondary/30"
        >
          <h3 className="font-display text-sm tracking-widest uppercase mb-4">
            {userReview ? "Update your review" : "Write a review"}
          </h3>
          <div className="mb-4">
            <StarRating value={rating} onChange={setRating} size={24} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts (optional)"
            maxLength={1000}
            rows={4}
            className="w-full bg-background border border-border p-3 text-sm outline-none focus:border-foreground transition-colors resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">{comment.length}/1000</span>
            <button
              onClick={submitReview}
              disabled={submitting || rating === 0}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? "Saving..." : userReview ? "Update Review" : "Post Review"}
            </button>
          </div>
        </motion.div>
      )}

      {user && !canReview && (
        <p className="text-sm text-muted-foreground mb-8 italic">
          Only verified buyers can leave a review for this product.
        </p>
      )}
      {!user && (
        <p className="text-sm text-muted-foreground mb-8 italic">
          Sign in to leave a review.
        </p>
      )}

      {/* Reviews list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your experience.</p>
      ) : (
        <ul className="space-y-6">
          {reviews.map((r) => (
            <motion.li
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pb-6 border-b border-border last:border-b-0"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <StarRating value={r.rating} readOnly size={14} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(r.created_at).toLocaleDateString(undefined, {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
                {user?.id === r.user_id && (
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Delete review"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {r.comment && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.comment}</p>
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ProductReviews;
