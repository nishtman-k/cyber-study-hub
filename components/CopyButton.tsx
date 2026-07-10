'use client';

import { useState, type RefObject } from 'react';

/**
 * "COPY" button shown on hover over a code block. Reads the code text from the
 * sibling <pre> (via ref) and writes it to the clipboard — matching the
 * original hub's COPY → COPIED → COPY behaviour.
 */
export default function CopyButton({
  targetRef,
}: {
  targetRef: RefObject<HTMLPreElement | null>;
}) {
  const [label, setLabel] = useState('COPY');
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const code = targetRef.current?.querySelector('code')?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(code);
      setLabel('COPIED');
      setCopied(true);
      setTimeout(() => {
        setLabel('COPY');
        setCopied(false);
      }, 1500);
    } catch {
      setLabel('FAIL');
    }
  }

  return (
    <button
      type="button"
      className={`copy-btn${copied ? ' copied' : ''}`}
      onClick={handleCopy}
      aria-label="Copy code to clipboard"
    >
      {label}
    </button>
  );
}
