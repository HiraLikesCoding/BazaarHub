'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/useToast';

const TOPICS = ['Order issue', 'Returns & refunds', 'Product question', 'Partnership', 'Other'];

export default function ContactForm() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', topic: TOPICS[0], message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || form.message.trim().length < 5) {
      toast.error('Please fill in your name, a valid email and a message.');
      return;
    }
    setSending(true);
    // Demo behaviour: there is no mail backend in this build.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSending(false);
    setSent(true);
    toast.success('Thanks! We will get back to you within 1 business day.');
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-ok-ink/30 bg-ok-soft p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ok-soft-2 text-xl">
          ✓
        </span>
        <h2 className="mt-3 text-lg font-semibold text-ink">Message sent</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Thanks {form.name.split(' ')[0]} - we will reply to {form.email} shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setForm({ name: '', email: '', topic: TOPICS[0], message: '' });
          }}
          className="btn-outline mt-5 bg-surface"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="label">
            Your name
          </label>
          <input id="contact-name" className="input" value={form.name} onChange={set('name')} placeholder="Jane Doe" />
        </div>
        <div>
          <label htmlFor="contact-email" className="label">
            Email address
          </label>
          <input
            id="contact-email"
            type="email"
            className="input"
            value={form.email}
            onChange={set('email')}
            placeholder="jane@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-topic" className="label">
          Topic
        </label>
        <select id="contact-topic" className="select" value={form.topic} onChange={set('topic')}>
          {TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="label">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          className="input resize-y"
          value={form.message}
          onChange={set('message')}
          placeholder="How can we help?"
        />
      </div>

      <button type="submit" disabled={sending} className="btn-primary disabled:opacity-60">
        {sending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
