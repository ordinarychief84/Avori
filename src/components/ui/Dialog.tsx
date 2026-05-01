'use client';

import * as React from 'react';
import * as RD from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Dialog = RD.Root;
export const DialogTrigger = RD.Trigger;
export const DialogClose = RD.Close;

export function DialogContent({
  children,
  className,
  title,
  description,
  showClose = true,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  showClose?: boolean;
}) {
  return (
    <RD.Portal>
      <RD.Overlay className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm data-[state=open]:animate-fade-in" />
      <RD.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-card data-[state=open]:animate-fade-in',
          className
        )}
      >
        {(title || description) && (
          <div className="mb-4">
            {title && <RD.Title className="text-lg font-semibold text-fg">{title}</RD.Title>}
            {description && (
              <RD.Description className="mt-1 text-sm text-fg-muted">{description}</RD.Description>
            )}
          </div>
        )}
        {children}
        {showClose && (
          <RD.Close
            className="absolute right-3 top-3 rounded-md p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </RD.Close>
        )}
      </RD.Content>
    </RD.Portal>
  );
}
