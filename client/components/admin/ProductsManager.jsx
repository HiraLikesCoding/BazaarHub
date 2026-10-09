'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { createProduct, deleteProduct, fetchProducts, updateProduct } from '@/services/products';
import { fetchCategories } from '@/services/categories';
import { formatPrice, stockStatus } from '@/lib/format';
import { STOCK_STATUS_STYLES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import Modal from '@/components/ui/Modal';
import { CardSkeleton } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { EmptyRow, PageHeader, Panel, SearchField, Td, Th } from './Table';
import ProductImage from '@/components/product/ProductImage';
import { PencilIcon, TrashIcon } from '@/components/ui/Icons';

const EMPTY_FORM = {
  name: '',
  category: '',
  brand: '',
  description: '',
  price: '',
  discountPrice: '',
  stock: '',
  featured: false,
  images: '',
};

const PAGE_SIZE = 8;

export default function ProductsManager() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [deleting, setDeleting] = useState(null);
  const debouncedSearch = useDebounce(search, 350);

  const { data: categoryData } = useFetch(() => fetchCategories(), []);
  const {
    data,
    loading,
    error,
    refetch,
  } = useFetch(() => fetchProducts({ search: debouncedSearch, page, limit: PAGE_SIZE }), [debouncedSearch, page]);

  const products = data?.products || [];

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={data ? `${data.total} products in the catalogue` : 'Manage your catalogue'}
        actions={
          <button type="button" onClick={() => setEditing('new')} className="btn-primary px-4 py-2.5 text-sm">
            + Add product
          </button>
        }
      />

      <Panel className="p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchField value={search} onChange={setSearch} placeholder="Search products…" />
          <p className="text-xs text-ink-faint">Click a row to edit it</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line-soft">
            <thead>
              <tr>
                <Th className="w-14">Image</Th>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th className="text-right">Price</Th>
                <Th className="text-center">Stock</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {loading && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <CardSkeleton count={PAGE_SIZE} className="py-2" />
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={6} className="p-4">
                    <ErrorState title="Could not load products" message={error} onRetry={refetch} />
                  </td>
                </tr>
              )}

              {!loading && !error && products.length === 0 && (
                <EmptyRow colSpan={6} message="No products match your search." />
              )}

              {!loading &&
                !error &&
                products.map((product) => (
                  <tr
                    key={product._id}
                    className="cursor-pointer transition hover:bg-surface-2/70"
                    onClick={() => setEditing(product)}
                  >
                    <Td>
                      <span className="relative block h-11 w-11 overflow-hidden rounded-lg border border-line-soft bg-surface-2">
                        <ProductImage src={product.images?.[0]} alt="" fill sizes="44px" />
                      </span>
                    </Td>
                    <Td>
                      <p className="font-semibold text-ink">{product.name}</p>
                      <p className="text-xs text-ink-faint">{product.brand || product.sku}</p>
                    </Td>
                    <Td className="text-ink-muted">{product.category}</Td>
                    <Td className="text-right">
                      <span className="font-semibold text-ink">
                        {formatPrice(product.discountPrice || product.price)}
                      </span>
                      {product.discountPrice > 0 && product.discountPrice < product.price && (
                        <span className="ml-1 text-xs text-ink-faint line-through">{formatPrice(product.price)}</span>
                      )}
                    </Td>
                    <Td className="text-center">
                      <span className={cn('badge', STOCK_STATUS_STYLES[stockStatus(product.stock)])}>
                        {product.stock}
                      </span>
                    </Td>
                    <Td className="text-right" onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(product)}
                          aria-label={`Edit ${product.name}`}
                          className="rounded-lg p-2 text-ink-faint transition hover:bg-brand-soft hover:text-brand-link"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(product)}
                          aria-label={`Delete ${product.name}`}
                          className="rounded-lg p-2 text-ink-faint transition hover:bg-danger-soft hover:text-danger-ink"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <Pagination page={data.page} pages={data.pages} onChange={setPage} className="mt-4" />
        )}
      </Panel>

      {editing && (
        <ProductFormModal
          product={editing === 'new' ? null : editing}
          categories={categoryData || []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
            toast.success(editing === 'new' ? 'Product created.' : 'Product updated.');
          }}
        />
      )}

      {deleting && (
        <DeleteModal
          title="Delete product"
          message={`"${deleting.name}" will be removed from the catalogue. This cannot be undone.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await deleteProduct(deleting._id);
              setDeleting(null);
              refetch();
              toast.success('Product deleted.');
            } catch (err) {
              toast.error(err.message || 'Could not delete the product.');
            }
          }}
        />
      )}
    </div>
  );
}

function ProductFormModal({ product, categories, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        category: product.category || '',
        brand: product.brand || '',
        description: product.description || '',
        price: product.price ?? '',
        discountPrice: product.discountPrice ?? '',
        stock: product.stock ?? '',
        featured: !!product.featured,
        images: (product.images || []).join('\n'),
      });
    } else {
      setForm({ ...EMPTY_FORM, category: categories[0]?.name || '' });
    }
  }, [product, categories]);

  const set = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  function validate() {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!form.category) next.category = 'Pick a category';
    if (form.description.trim().length < 10) next.description = 'Description must be at least 10 characters';
    if (!(Number(form.price) >= 0) || form.price === '') next.price = 'Enter a valid price';
    if (form.discountPrice !== '' && Number(form.discountPrice) >= Number(form.price))
      next.discountPrice = 'Discount must be lower than the price';
    if (form.stock === '' || Number(form.stock) < 0) next.stock = 'Enter the stock level';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      category: form.category,
      brand: form.brand.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      discountPrice: form.discountPrice === '' ? 0 : Number(form.discountPrice),
      stock: Number(form.stock),
      featured: form.featured,
      images: form.images
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    };

    setSaving(true);
    try {
      if (product) await updateProduct(product._id, payload);
      else await createProduct(payload);
      onSaved();
    } catch (err) {
      setErrors({ submit: err.message || 'Could not save the product.' });
      toast.error(err.message || 'Could not save the product.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={product ? 'Edit product' : 'Add product'}
      description={product ? `Updating ${product.name}` : 'New item for the catalogue'}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button type="submit" form="product-form" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" id="p-name" error={errors.name} className="sm:col-span-2">
            <input id="p-name" className="input" value={form.name} onChange={set('name')} />
          </Field>

          <Field label="Category" id="p-category" error={errors.category}>
            <select id="p-category" className="select" value={form.category} onChange={set('category')}>
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Brand" id="p-brand">
            <input id="p-brand" className="input" value={form.brand} onChange={set('brand')} placeholder="Optional" />
          </Field>

          <Field label="Price (USD)" id="p-price" error={errors.price}>
            <input id="p-price" type="number" min="0" step="0.01" className="input" value={form.price} onChange={set('price')} />
          </Field>

          <Field label="Sale price" id="p-discount" error={errors.discountPrice} hint="Leave empty for no sale">
            <input
              id="p-discount"
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={form.discountPrice}
              onChange={set('discountPrice')}
            />
          </Field>

          <Field label="Stock" id="p-stock" error={errors.stock}>
            <input id="p-stock" type="number" min="0" className="input" value={form.stock} onChange={set('stock')} />
          </Field>

          <div className="flex items-end pb-2">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={set('featured')}
                className="h-4 w-4 rounded border-line-strong text-brand-link focus:ring-brand-500"
              />
              Feature on the home page
            </label>
          </div>

          <Field
            label="Description"
            id="p-description"
            error={errors.description}
            className="sm:col-span-2"
          >
            <textarea id="p-description" rows={4} className="input resize-y" value={form.description} onChange={set('description')} />
          </Field>

          <Field
            label="Images"
            id="p-images"
            className="sm:col-span-2"
            hint="One path or URL per line - the first one is the cover"
          >
            <textarea
              id="p-images"
              rows={3}
              className="input resize-y font-mono text-xs"
              value={form.images}
              onChange={set('images')}
              placeholder="/images/products/example.jpg"
            />
          </Field>
        </div>

        {errors.submit && (
          <p className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger-ink" role="alert">
            {errors.submit}
          </p>
        )}
      </form>
    </Modal>
  );
}

function Field({ label, id, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-danger-ink">{error}</p>}
    </div>
  );
}

function DeleteModal({ title, message, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="btn-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">{message}</p>
    </Modal>
  );
}
