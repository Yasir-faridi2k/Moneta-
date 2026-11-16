import { createContext, useContext, useState, type FormEvent, type ReactNode } from 'react';
import { Check, CircleAlert, LoaderCircle, Plus, X } from 'lucide-react';

type Toast = { id: number; message: string; kind: 'success' | 'error' };
const ToastContext = createContext<(message: string, kind?: Toast['kind']) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const notify = (message: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3600);
  };
  return <ToastContext.Provider value={notify}>
    {children}
    <div className="toast-stack" aria-live="polite">{items.map((item) => <div key={item.id} className={`toast toast-${item.kind}`}>
      {item.kind === 'success' ? <Check size={17} /> : <CircleAlert size={17} />}{item.message}
    </div>)}</div>
  </ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext);

export function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-heading">
    <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>
    {action && <div className="page-heading-action">{action}</div>}
  </div>;
}

export function Panel({ children, title, subtitle, action, className = '' }: { children: ReactNode; title?: string; subtitle?: string; action?: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{(title || action) && <div className="panel-heading"><div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>{action}</div>}{children}</section>;
}

export function Modal({ title, description, onClose, children, wide = false }: { title: string; description?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-heading"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div>
      {children}
    </section>
  </div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function LoadingState({ label = 'Loading your data…' }: { label?: string }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={22} /><span>{label}</span></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="error-state"><CircleAlert size={20} /><div><strong>We couldn’t load this page.</strong><span>{message}</span></div><Button variant="secondary" onClick={onRetry}>Try again</Button></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-symbol"><Plus size={19} /></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function FormActions({ onCancel, busy, submitLabel }: { onCancel: () => void; busy?: boolean; submitLabel: string }) {
  return <div className="form-actions"><Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy && <LoaderCircle className="spin" size={16} />}{submitLabel}</Button></div>;
}

export function Form({ onSubmit, children, className = '' }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode; className?: string }) {
  return <form className={`form ${className}`} onSubmit={onSubmit}>{children}</form>;
}
