'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';
import { discountPercent, formatDate, stockStatus } from '@/lib/format';
import { addReview, fetchProduct } from '@/services/products';
import Price from './Price';
import ProductImage from './ProductImage';
import Rating from './Rating';
import QuantityStepper from '@/components/ui/QuantityStepper';
import Modal from '@/components/ui/Modal';
import {
  CartIcon,
  CheckCircleIcon,
  RefreshIcon,
  ShieldIcon,
  TruckIcon,
} from '@/components/ui/Icons';

const PERKS = [
  { icon: TruckIcon, title: 'Free shipping', text: 'Orders over $75' },
  { icon: RefreshIcon, title: '30-day returns', text: 'Easy and free' },
  { icon: ShieldIcon, title: 'Secure payment', text: 'Cash on delivery' },
];

export default function ProductDetail({ product: initialProduct }) {
  const router = useRouter();
  const { addItem, toggleWishlist, isInWishlist } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(initialProduct);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const images = product.images?.length ? product.images : [''];
  const stock = Number(product.stock) || 0;
  const outOfStock = stock <= 0;
  const wished = isInWishlist(product._id);
  const discount = discountPercent(product.price, product.discountPrice);

  function handleAddToCart() {
    const result = addItem(product, quantity);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  }

  function handleBuyNow() {
    const result = addItem(product, quantity);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    router.push('/checkout');
  }

  function openReview() {
    if (!isAuthenticated) {
      toast.info('Please log in to write a review.');
      router.push('/login?next=/products/' + (product.slug || product._id));
      return;
    }
    setReviewOpen(true);
  }

  async function submitReview(event) {
    event.preventDefault();
    setFormError('');
    if (review.comment.trim().length < 3) {
      setFormError('Please write at least a few words about the product.');
      return;
    }
    setSubmitting(true);
    try {
      const data = await addReview(product._id, {
        rating: Number(review.rating),
        comment: review.comment.trim(),
      });
      setProduct((current) => ({
        ...current,
        rating: data.rating,
        numReviews: data.numReviews,
        reviews: data.reviews,
      }));
      setReviewOpen(false);
      setReview({ rating: 5, comment: '' });
      toast.success('Thanks for your review!');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* Gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-surface-2">
          <ProductImage
            key={activeImage}
            src={images[activeImage]}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="animate-fade-in"
          />
          {discount > 0 && (
            <span className="badge-danger absolute left-4 top-4 shadow-sm">-{discount}%</span>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={image + index}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`View image ${index + 1}`}
                aria-current={index === activeImage}
                className={cn(
                  'relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-surface-2 transition sm:h-24 sm:w-24',
                  index === activeImage
                    ? 'border-brand-600'
                    : 'border-line hover:border-brand-300'
                )}
              >
                <ProductImage src={image} alt="" fill sizes="96px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge-brand">{product.category}</span>
          {product.brand && <span className="text-sm text-ink-subtle">{product.brand}</span>}
          {product.sku && <span className="text-xs text-ink-faint">SKU: {product.sku}</span>}
        </div>

        <h1 className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl lg:text-4xl">
          {product.name}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Rating value={product.rating} count={product.numReviews} size="md" />
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="text-sm font-medium text-brand-link hover:text-brand-ink"
          >
            Write a review
          </button>
        </div>

        <div className="mt-5">
          <Price price={product.price} discountPrice={product.discountPrice} size="lg" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span
            className={cn(
              'badge',
              stock <= 0 ? 'badge-danger' : stock <= 10 ? 'badge-warning' : 'badge-success'
            )}
          >
            {stockStatus(product.stock)}
          </span>
          {stock > 0 && stock <= 10 && (
            <span className="text-warn-ink">Hurry - only {stock} left in stock</span>
          )}
          {product.sold > 0 && <span className="text-ink-subtle">{product.sold}+ sold</span>}
        </div>

        <p className="mt-5 leading-relaxed text-ink-muted">{product.description}</p>

        {/* Quantity + actions */}
        <div className="mt-7 rounded-2xl border border-line bg-surface-2/70 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="label mb-1.5">Quantity</span>
              <QuantityStepper
                value={quantity}
                onChange={(next) => setQuantity(Math.min(Math.max(1, next), Math.max(1, stock)))}
                max={Math.max(1, stock)}
              />
            </div>
            <p className="mt-6 text-xs text-ink-subtle">
              {stock > 0 ? `${stock} available` : 'Currently unavailable'}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="btn-lg flex-1 bg-surface text-brand-ink ring-1 ring-brand-600 hover:bg-brand-soft"
            >
              <CartIcon className="h-5 w-5" />
              Add to Cart
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={outOfStock}
              className="btn-lg flex-1 bg-brand-600 text-white hover:bg-brand-700"
            >
              {outOfStock ? 'Out of stock' : 'Buy Now'}
            </button>
            <button
              type="button"
              onClick={() => {
                toggleWishlist(product._id);
                toast.info(wished ? 'Removed from wishlist.' : 'Saved to wishlist.');
              }}
              aria-pressed={wished}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              className={cn(
                'btn-lg px-4 ring-1 transition',
                wished
                  ? 'bg-danger-soft text-danger-ink ring-danger-ink/40'
                  : 'bg-surface text-ink-muted ring-line hover:text-danger-ink'
              )}
            >
              {wished ? '♥ Saved' : '♡ Wishlist'}
            </button>
          </div>
        </div>

        {/* Perks */}
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5"
            >
              <Icon className="h-5 w-5 shrink-0 text-brand-link" />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-ink">{title}</p>
                <p className="truncate text-[11px] text-ink-subtle">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Specifications */}
        {product.specifications?.length > 0 && (
          <div className="mt-8">
            <h2 className="text-base font-semibold text-ink">Specifications</h2>
            <dl className="mt-3 divide-y divide-line-soft overflow-hidden rounded-2xl border border-line">
              {product.specifications.map((spec) => (
                <div
                  key={spec.key}
                  className="grid grid-cols-1 gap-1 bg-surface px-4 py-3 sm:grid-cols-3 sm:gap-4"
                >
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                    {spec.key}
                  </dt>
                  <dd className="text-sm text-ink sm:col-span-2">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      {/* Reviews */}
      <section className="lg:col-span-2" id="reviews">
        <div className="rounded-3xl border border-line p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-ink">Customer Reviews</h2>
              <div className="mt-2 flex items-center gap-3">
                <Rating value={product.rating} size="md" />
                <span className="text-sm text-ink-subtle">
                  {product.numReviews || 0} review{(product.numReviews || 0) === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            <button type="button" onClick={openReview} className="btn-outline">
              Write a review
            </button>
          </div>

          <div className="mt-6 space-y-5">
            {product.reviews?.length ? (
              product.reviews.map((item, index) => (
                <article key={item._id || index} className="border-t border-line-soft pt-5 first:border-0 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft-2 text-xs font-bold text-brand-ink">
                        {(item.name || '?').slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{item.name}</p>
                        <p className="text-xs text-ink-faint">
                          {formatDate(item.createdAt || item._id)}
                        </p>
                      </div>
                    </div>
                    <Rating value={item.rating} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.comment}</p>
                </article>
              ))
            ) : (
              <p className="rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-ink-subtle">
                No reviews yet - be the first to share your thoughts.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Review modal */}
      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Write a review"
        description={`Sharing your experience with ${product.name}`}
        footer={
          <>
            <button type="button" onClick={() => setReviewOpen(false)} className="btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              form="review-form"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </>
        }
      >
        <form id="review-form" onSubmit={submitReview} className="space-y-4">
          <div>
            <span className="label">Your rating</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReview((r) => ({ ...r, rating: star }))}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  className={cn(
                    'text-3xl transition hover:scale-110',
                    review.rating >= star ? 'text-accent-500' : 'text-ink-faint'
                  )}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="review-comment" className="label">
              Your review
            </label>
            <textarea
              id="review-comment"
              rows={4}
              value={review.comment}
              onChange={(event) => setReview((r) => ({ ...r, comment: event.target.value }))}
              placeholder="What did you like or dislike about this product?"
              className="input resize-y"
              required
            />
            {formError && (
              <p className="mt-1.5 text-xs font-medium text-danger-ink" role="alert">
                {formError}
              </p>
            )}
          </div>

          <p className="flex items-center gap-2 text-xs text-ink-subtle">
            <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
            Your review helps other shoppers decide.
          </p>
        </form>
      </Modal>
    </div>
  );
}
