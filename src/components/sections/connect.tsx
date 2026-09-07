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
  'w-full border-0 border-b border-border bg-transparent px-0 py-3 text-[15px] text-foreground placeholder:text-ink-3 transition-colors duration-300 hover:border-ink-3 focus:border-foreground focus:outline-none';

/**
 * The ask.
 *
 * The address is the largest thing on the site, larger than the section headings and
 * larger than the work. It was previously a 24px link sitting under a paragraph, on a
 * page whose smallest heading was twice its size — which is the wrong way round for the
 * one element the whole page exists to get someone to use.
 *
 * The form keeps its own column underneath. Its inputs lost their cards and became
 * ruled lines: boxes were the body's default gesture everywhere and they are the reason
 * the page read as a template.
 */
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
    <section id="connect" className="scroll-mt-24 py-32">
      <div className="shell">
        <Reveal>
          <p className="eyebrow">Connect</p>
        </Reveal>

        <Words
          as="h2"
          text="Ready to create?"
          delay={1}
          className="mt-6 font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-tight tracking-tight text-ink-2"
        />

        {/* The one accented element on this screen, and the largest on the site. */}
        <Reveal delay={2}>
          <a
            href={`mailto:${EMAIL}`}
            className="group mt-8 block font-display text-mega font-semibold tracking-tight text-foreground transition-colors duration-500 hover:text-accent"
          >
            {EMAIL}
            <span className="mt-4 block h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-700 ease-smooth group-hover:scale-x-100 motion-reduce:transition-none" />
          </a>
        </Reveal>

        <Reveal delay={3}>
          <p className="mt-8 max-w-md text-pretty text-lg leading-relaxed text-ink-2">
            Tell us what you are making and when you need it. We reply within a day.
          </p>
        </Reveal>

        {/* The fields arrive one after another rather than the form arriving whole. */}
        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-20 grid grid-cols-1 gap-x-16 gap-y-4 md:grid-cols-2"
        >
          <Reveal delay={1}>
            <Field id="f-name" label="Name" error={errors.name}>
              <input
                id="f-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name…"
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
                spellCheck={false}
                placeholder="you@studio.com"
                aria-invalid={Boolean(errors.email)}
                className={cn(inputClass, errors.email && 'border-destructive')}
              />
            </Field>
          </Reveal>

          <Reveal delay={3} className="md:col-span-2">
            <Field id="f-message" label="Project" error={errors.message}>
              <textarea
                id="f-message"
                name="message"
                rows={4}
                placeholder="What are you making, and when do you need it?"
                aria-invalid={Boolean(errors.message)}
                className={cn(inputClass, 'resize-y', errors.message && 'border-destructive')}
              />
            </Field>
          </Reveal>

          <Reveal delay={4} className="md:col-span-2">
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <Button
                type="submit"
                size="lg"
                className="h-12 rounded-full bg-foreground px-8 text-[15px] font-medium text-background hover:bg-foreground/90"
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
