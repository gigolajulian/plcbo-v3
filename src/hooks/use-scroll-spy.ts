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
        /* Measured against the document, not `offsetTop`. `offsetTop` is relative to
           the nearest positioned ancestor, and `#intro` now lives inside the hero's
           positioned runway so it can be held on screen — which made its reported
           position the offset within the hero rather than down the page. */
        if (el && el.getBoundingClientRect().top + window.scrollY <= line) current = id;
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
