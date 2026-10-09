'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { updateProfile } from '@/services/auth';
import { initials } from '@/lib/format';

export default function ProfilePanel() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '' });
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error('Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: form.name.trim() });
      await refresh();
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.message || 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft-2 text-2xl font-bold text-brand-ink">
        {initials(user?.name)}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-name" className="label">
              Full name
            </label>
            <input
              id="profile-name"
              className="input"
              value={form.name}
              onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="profile-email" className="label">
              Email address
            </label>
            <input id="profile-email" className="input bg-surface-2" value={form.email} disabled readOnly />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <span className="self-center text-xs text-ink-faint">Role: {user?.role || 'customer'}</span>
        </div>
      </form>
    </div>
  );
}
