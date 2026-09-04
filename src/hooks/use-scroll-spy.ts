import * as React from 'react';

/** Reports which section id is currently occupying the viewport. */
export function useScrollSpy(ids: string[], offset = 120) {
  const [active, setActive] = React.useState(ids[0] ?? '');

  React.useEffect(() => {
    const onScroll = () => {
      const line = window.scrollY + offset;
      let current = ids[0] ?? '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= line) current = id;
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ids, offset]);

  return active;
}

/** True once the reader has scrolled past `threshold` pixels. */
export function useScrolledPast(threshold: number) {
  const [past, setPast] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setPast(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return past;
}
