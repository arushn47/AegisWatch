'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/** True when the user has asked the OS to minimise motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

interface StaggerOptions {
  y?: number;
  stagger?: number;
  /** Optional child selector; defaults to the container's direct children. */
  selector?: string;
}

/**
 * Staggers a container's children into view the first time `active` becomes
 * true (e.g. once live data has landed). Runs a single time, cleans up via a
 * GSAP context, and no-ops entirely under `prefers-reduced-motion`.
 */
export function useStaggerIn<T extends HTMLElement>(active: boolean, options?: StaggerOptions) {
  const ref = useRef<T>(null);
  const hasRun = useRef(false);
  const { y = 14, stagger = 0.035, selector } = options ?? {};

  useEffect(() => {
    const el = ref.current;
    if (!el || !active || hasRun.current) return;
    hasRun.current = true;
    if (prefersReducedMotion()) return;

    const targets = selector ? el.querySelectorAll(selector) : el.children;
    if (!targets || targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        opacity: 0,
        y,
        duration: 0.45,
        ease: 'power2.out',
        stagger,
        // Leave no inline transform/opacity behind once done.
        clearProps: 'opacity,transform',
      });
    }, el);

    return () => ctx.revert();
  }, [active, y, stagger, selector]);

  return ref;
}

/**
 * Counts a number up from its previous value to `value`. Updates the DOM
 * directly (no re-render per frame) and snaps instantly under reduced motion.
 */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const current = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.textContent = String(value);
      current.current = value;
      return;
    }

    const from = current.current;
    el.textContent = String(Math.round(from));
    const obj = { v: from };

    const tween = gsap.to(obj, {
      v: value,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = String(Math.round(obj.v));
      },
      onComplete: () => {
        current.current = value;
      },
    });

    return () => {
      tween.kill();
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
