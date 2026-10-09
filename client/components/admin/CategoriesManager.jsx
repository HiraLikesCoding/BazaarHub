'use client';

import { useEffect, useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useToast } from '@/hooks/useToast';
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '@/services/categories';
import Modal from '@/components/ui/Modal';
import { CardSkeleton } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/EmptyState';
import { EmptyRow, PageHeader, Panel, Td, Th } from './Table';
import { PencilIcon, TrashIcon } from '@/components/ui/Icons';

const EMPTY_FORM = { name: '', description: '', image: '', icon: '' };

export default function CategoriesManager() {
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | 'new' | category
  const [deleting, setDeleting] = useState(null);
  const { data: categories, loading, error, refetch } = useFetch(() => fetchCategories(), []);

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Departments shown on the home page and in the shop filters"
        actions={
          <button type="button" onClick={() => setEditing('new')} className="btn-primary px-4 py-2.5 text-sm">
            + Add category
          </button>
        }
      />

      <Panel className="p-4 sm:p-5">
        {loading && <CardSkeleton count={6} />}
        {error && <ErrorState title="Could not load categories" message={error} onRetry={refetch} />}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line-soft">
              <thead>
                <tr>
                  <Th>Icon</Th>
                  <Th>Name</Th>
                  <Th>Description</Th>
                  <Th className="text-center">Products</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {!categories?.length && <EmptyRow colSpan={5} message="No categories yet." />}

                {categories?.map((category) => (
                  <tr key={category._id} className="transition hover:bg-surface-2/70">
                    <Td>
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-3 text-base">
                        {category.icon || '🗂'}
                      </span>
                    </Td>
                    <Td className="font-semibold text-ink">{category.name}</Td>
                    <Td className="max-w-md text-ink-subtle">
                      <span className="line-clamp-2">{category.description || '—'}</span>
                    </Td>
                    <Td className="text-center font-semibold text-ink-muted">{category.productCount ?? 0}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(category)}
                          aria-label={`Edit ${category.name}`}
                          className="rounded-lg p-2 text-ink-faint transition hover:bg-brand-soft hover:text-brand-link"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(category)}
                          aria-label={`Delete ${category.name}`}
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
        )}
      </Panel>

      {editing && (
        <CategoryFormModal
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
            toast.success(editing === 'new' ? 'Category created.' : 'Category updated.');
          }}
        />
      )}

      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          size="sm"
          title="Delete category"
          footer={
            <>
              <button type="button" onClick={() => setDeleting(null)} className="btn-outline">
                Cancel
              </button>
              <DeleteConfirm
                category={deleting}
                onDone={() => {
                  setDeleting(null);
                  refetch();
                  toast.success('Category deleted.');
                }}
              />
            </>
          }
        >
          <p className="text-sm text-ink-muted">
            "{deleting.name}" will be removed. Products in this category are kept but will no longer be
            grouped.
          </p>
        </Modal>
      )}
    </div>
  );
}

function DeleteConfirm({ category, onDone }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await deleteCategory(category._id);
          onDone();
        } catch (err) {
          toast.error(err.message || 'Could not delete the category.');
        } finally {
          setBusy(false);
        }
      }}
      className="btn-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
    >
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  );
}

function CategoryFormModal({ category, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(
      category
        ? {
            name: category.name || '',
            description: category.description || '',
            image: category.image || '',
            icon: category.icon || '',
          }
        : EMPTY_FORM
    );
  }, [category]);

  const set = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
        icon: form.icon.trim(),
      };
      if (category) await updateCategory(category._id, payload);
      else await createCategory(payload);
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save the category.');
      toast.error(err.message || 'Could not save the category.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? 'Edit category' : 'Add category'}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button type="submit" form="category-form" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Saving…' : category ? 'Save changes' : 'Create category'}
          </button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="c-name" className="label">
            Name
          </label>
          <input id="c-name" className="input" value={form.name} onChange={set('name')} placeholder="Home & Living" />
        </div>

        <div>
          <label htmlFor="c-description" className="label">
            Description
          </label>
          <textarea
            id="c-description"
            rows={3}
            className="input resize-y"
            value={form.description}
            onChange={set('description')}
            placeholder="Shown under the category tile"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="c-image" className="label">
              Image path
            </label>
            <input
              id="c-image"
              className="input font-mono text-xs"
              value={form.image}
              onChange={set('image')}
              placeholder="/images/products/category.jpg"
            />
          </div>
          <div>
            <label htmlFor="c-icon" className="label">
              Icon
            </label>
            <input
              id="c-icon"
              className="input"
              value={form.icon}
              onChange={set('icon')}
              placeholder="🏠 (emoji)"
              maxLength={4}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger-ink" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
