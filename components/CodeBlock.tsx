'use client';

import { useRef, type ReactNode } from 'react';
import CopyButton from './CopyButton';

/**
 * Replaces the default <pre> rendered by react-markdown so every code block
 * gets a hover COPY button, exactly like the source hub.
 */
export default function CodeBlock({ children }: { children?: ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  return (
    <pre ref={preRef}>
      {children}
      <CopyButton targetRef={preRef} />
    </pre>
  );
}
