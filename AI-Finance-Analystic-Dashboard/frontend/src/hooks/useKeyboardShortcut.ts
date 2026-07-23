import { useEffect, useRef } from 'react';

type KeyCombo = string; // e.g. 'ctrl+k', 'shift+?', 'escape'

interface UseKeyboardShortcutOptions {
  /** Target element. Defaults to window. */
  target?: HTMLElement | Window | null;
  /** Prevent default browser action when shortcut fires. Default true. */
  preventDefault?: boolean;
  /** Stop event propagation. Default false. */
  stopPropagation?: boolean;
  /** Only fire when no text input / textarea is focused. Default true. */
  ignoreInputs?: boolean;
}

function parseCombo(combo: KeyCombo): { key: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } {
  const parts = combo.toLowerCase().split('+');
  return {
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta') || parts.includes('cmd'),
    key: parts.find((p) => !['ctrl', 'shift', 'alt', 'meta', 'cmd'].includes(p)) ?? '',
  };
}

function matchesCombo(event: KeyboardEvent, combo: ReturnType<typeof parseCombo>): boolean {
  return (
    event.key.toLowerCase() === combo.key &&
    event.ctrlKey === combo.ctrl &&
    event.shiftKey === combo.shift &&
    event.altKey === combo.alt &&
    event.metaKey === combo.meta
  );
}

function isInputFocused(): boolean {
  const tag = (document.activeElement?.tagName ?? '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || (document.activeElement as HTMLElement)?.isContentEditable;
}

/**
 * useKeyboardShortcut — Attach global (or element-scoped) keyboard shortcuts.
 *
 * @param combo   Key combination string, e.g. `'ctrl+k'`, `'escape'`, `'shift+?'`.
 * @param handler Callback invoked when the combo is pressed.
 * @param options Configuration.
 *
 * @example
 * useKeyboardShortcut('ctrl+k', () => setCommandPaletteOpen(true));
 * useKeyboardShortcut('escape', () => setCommandPaletteOpen(false), { ignoreInputs: false });
 */
export function useKeyboardShortcut(
  combo: KeyCombo | KeyCombo[],
  handler: (event: KeyboardEvent) => void,
  options: UseKeyboardShortcutOptions = {}
): void {
  const {
    target = typeof window !== 'undefined' ? window : null,
    preventDefault = true,
    stopPropagation = false,
    ignoreInputs = true,
  } = options;

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!target) return;

    const combos = (Array.isArray(combo) ? combo : [combo]).map(parseCombo);

    const onKeyDown = (event: KeyboardEvent) => {
      if (ignoreInputs && isInputFocused()) return;
      const matched = combos.some((c) => matchesCombo(event, c));
      if (!matched) return;
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      handlerRef.current(event);
    };

    (target as Window).addEventListener('keydown', onKeyDown as EventListener);
    return () => (target as Window).removeEventListener('keydown', onKeyDown as EventListener);
  }, [combo, target, preventDefault, stopPropagation, ignoreInputs]);
}
