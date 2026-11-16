import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import type { Category } from '../types';
import { api } from '../services/api';
import { Button, EmptyState, ErrorState, Field, Form, FormActions, LoadingState, Modal, PageTitle, useToast } from '../components/ui';

const suggestedColors = ['#6b8f71', '#e7a96b', '#7391b8', '#b8849d', '#72a99a', '#9b8ac4', '#d27f6c', '#89947d'];

function CategoryForm({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? suggestedColors[0]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const notify = useToast();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setProblem('');
    try {
      if (category) await api.updateCategory(category.id, { name: name.trim(), color });
      else await api.createCategory({ name: name.trim(), color });
      notify(category ? 'Category updated.' : 'Category created.'); onSaved();
    } catch (cause) { setProblem(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }

  return <Modal title={category ? 'Edit category' : 'New category'} description="Make your spending easy to recognize." onClose={onClose}>
    <Form onSubmit={submit}>
      <Field label="Category name"><input autoFocus required maxLength={50} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Wellness" /></Field>
      <Field label="Color"><div className="color-options">{suggestedColors.map((choice) => <button key={choice} type="button" aria-label={`Choose ${choice}`} aria-pressed={color === choice} className={color === choice ? 'selected' : ''} style={{ background: choice }} onClick={() => setColor(choice)} />)}<label className="custom-color" title="Choose a custom color"><input type="color" value={color} onChange={(event) => setColor(event.target.value)} /><span>Custom</span></label></div></Field>
      {problem && <div className="form-error">{problem}</div>}
      <FormActions onCancel={onClose} busy={busy} submitLabel={category ? 'Save changes' : 'Create category'} />
    </Form>
  </Modal>;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const notify = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setCategories(await api.categories()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function remove(category: Category) {
    if (!window.confirm(`Delete the “${category.name}” category?`)) return;
    try { await api.deleteCategory(category.id); notify('Category deleted.'); await load(); }
    catch (cause) { notify(cause instanceof Error ? cause.message : 'Could not delete category.', 'error'); }
  }

  return <div className="page">
    <PageTitle eyebrow="MAKE IT YOURS" title="Categories" description="The labels behind your money habits." action={<Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> New category</Button>} />
    <div className="category-intro"><span className="category-intro-mark"><Tag size={19} /></span><div><strong>{categories.length} categories</strong><span>Use categories to keep transactions and budgets organized.</span></div></div>
    {loading && <LoadingState label="Loading categories…" />}
    {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
    {!loading && !error && <div className="category-manage-grid">{categories.length ? categories.map((category) => {
      const inUse = (category._count?.transactions ?? 0) > 0 || (category._count?.budgets ?? 0) > 0;
      return <article className="category-manage-card panel" key={category.id}>
        <div className="category-manage-top"><span className="category-manage-icon" style={{ color: category.color, background: `${category.color}1a` }}><Tag size={18} /></span><div className="row-actions"><button className="icon-button small" aria-label={`Edit ${category.name}`} onClick={() => { setEditing(category); setShowForm(true); }}><Pencil size={15} /></button><button className="icon-button small danger-text" aria-label={`Delete ${category.name}`} disabled={inUse} title={inUse ? 'A category used by records cannot be deleted' : 'Delete category'} onClick={() => void remove(category)}><Trash2 size={15} /></button></div></div>
        <h2>{category.name}</h2><div className="category-manage-foot"><span>{category._count?.transactions ?? 0} transactions</span><span>{category._count?.budgets ?? 0} budgets</span></div>
      </article>;
    }) : <div className="panel category-empty"><EmptyState title="A fresh start" description="Create a category to organize your transactions." action={<Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} /> Create category</Button>} /></div>}</div>}
    {showForm && <CategoryForm category={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); void load(); }} />}
  </div>;
}
