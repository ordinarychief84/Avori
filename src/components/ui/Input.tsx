import * as React from 'react';
import { cn } from '@/lib/cn';

const baseInput =
  'block w-full bg-surface text-fg placeholder:text-fg-subtle rounded-md border border-border ' +
  'px-3 py-2 text-sm transition-colors ' +
  'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseInput, 'h-10', className)} {...props} />
  )
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(baseInput, 'min-h-[88px] py-2.5', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(baseInput, 'h-10 pr-8', className)} {...props}>
    {children}
  </select>
));
Select.displayName = 'Select';

export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-fg">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}
