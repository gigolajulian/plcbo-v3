import * as React from 'react';

import { Reveal, Words } from '@/components/reveal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const EMAIL = 'hello@plcbo.co';

type Errors = Partial<Record<'name' | 'email' | 'message', string>>;

function validate(data: { name: string; email: string; message: string }): Errors {
  const errors: Errors = {};
  if (!data.name.trim()) errors.name = 'Tell us who you are.';
  if (!data.email.trim()) errors.email = 'We need an address to reply to.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim()))
    errors.email = 'That address does not look right.';
  if (data.message.trim().length < 12) errors.message = 'A sentence or two is plenty.';
  return errors;
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-3 block">
        {label}
      </label>
      {children}
      {/* the message is live so a screen reader hears it when it appears, not only
          if the reader happens to walk back over the field */}
      <p role="alert" className="mt-2 min-h-[18px] text-[13px] text-destructive">
        {error}
      </p>
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-border bg-card px-4 py-3 text-[15px] text-foreground placeholder:text-ink-3 transition-colors duration-300 hover:border-ink-3/50 focus:border-accent focus:outline-none';

export function Connect() {
  const [errors, setErrors] = React.useState<Errors>({});
  const [sent, setSent] = React.useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      message: String(form.get('message') ?? ''),
    };

    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = document.getElementById(`f-${Object.keys(found)[0]}`);
      first?.focus();
      return;
    }

    /* No backend on this site. The form hands a pre-filled draft to whatever mail
       client the reader already uses — nothing is transmitted from the page. */
    const subject = encodeURIComponent(`New project — ${data.name}`);
    const body = encodeURIComponent(`${data.message}\n\n— ${data.name}\n${data.email}`);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <section id="connect" className="scroll-mt-24 border-t border-border py-26">
      <div className="shell grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-26">
        <div>
          <Reveal>
            <p className="eyebrow">Connect</p>
          </Reveal>
          {/* two runs of words rather than one, because the second line is a
              different colour and `Words` takes a string, not markup */}
          <h2 className="mt-6 font-display text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[0.95] tracking-tight text-foreground">
            <Words as="span" text="Ready to" delay={1} />
            <br />
            <Words as="span" text="Create?" delay={2} className="text-accent" />
          </h2>
          <Reveal delay={2}>
            <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-ink-2">
              Tell us what you are making and when you need it. We reply within a day.
            </p>
          </Reveal>
          <Reveal delay={3}>
            <a
              href={`mailto:${EMAIL}`}
              className="mt-10 inline-flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-foreground transition-colors hover:text-accent"
            >
              {EMAIL}
              <span aria-hidden="true">→</span>
            </a>
          </Reveal>
        </div>

        {/* The fields arrive one after another rather than the form arriving whole.
            `space-y-4` still applies — it spaces direct children, and the Reveal
            wrappers are now the direct children. */}
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Reveal delay={1}>
            <Field id="f-name" label="Name" error={errors.name}>
              <input
                id="f-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                aria-invalid={Boolean(errors.name)}
                className={cn(inputClass, errors.name && 'border-destructive')}
              />
            </Field>
          </Reveal>

          <Reveal delay={2}>
            <Field id="f-email" label="Email" error={errors.email}>
              <input
                id="f-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@studio.com"
                aria-invalid={Boolean(errors.email)}
                className={cn(inputClass, errors.email && 'border-destructive')}
              />
            </Field>
          </Reveal>

          <Reveal delay={3}>
            <Field id="f-message" label="Project" error={errors.message}>
              <textarea
                id="f-message"
                name="message"
                rows={5}
                placeholder="What are you making, and when do you need it?"
                aria-invalid={Boolean(errors.message)}
                className={cn(inputClass, 'resize-y', errors.message && 'border-destructive')}
              />
            </Field>
          </Reveal>

          <Reveal delay={4}>
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <Button
                type="submit"
                size="lg"
                className="h-12 rounded-full bg-accent px-8 text-[15px] font-medium text-accent-foreground hover:bg-accent/90"
              >
                Send it over
              </Button>
              <p aria-live="polite" className="text-[13px] text-ink-3">
                {sent ? 'Opening your mail client…' : 'Opens in your mail client.'}
              </p>
            </div>
          </Reveal>
        </form>
      </div>
    </section>
  );
}
