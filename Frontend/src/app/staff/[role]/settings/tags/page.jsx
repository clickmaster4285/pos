'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Pencil, Trash2, Tag } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useGetUserQuery } from '@/features/authApi';
import { addMyTag, updateMyTag, removeMyTag } from '@/features/tagsApi';

// tiny debounce hook
function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export default function Page() {
  const dispatch = useDispatch();

  // user with embedded tags
  const { data: user, isFetching, isError, refetch } = useGetUserQuery();

  // search state
  const [query, setQuery] = useState('');
  const dq = useDebounced(query, 300);

  // modal + form state
  const [open, setOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [form, setForm] = useState({ name: '', color: '#3b82f6' });

  // local busy flags (mutation actions)
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Prepare a clean list of tags from user.tags (ignore deleted/null)
  const baseTags = useMemo(() => {
    const list = Array.isArray(user?.tags) ? user.tags : [];

    return list.filter((t) => t && !t.isDeleted);
  }, [user]);

  // Apply search locally (name contains)
  const tags = useMemo(() => {
    const q = dq.trim().toLowerCase();
    if (!q) return baseTags;
    return baseTags.filter((t) => (t.name || '').toLowerCase().includes(q));
  }, [baseTags, dq]);

  const loadingList = isFetching; // loading state now tied to user query
  const hasAnyTags = (baseTags?.length ?? 0) > 0;

  const openCreate = () => {
    setEditingTag(null);
    setForm({ name: '', color: '#3b82f6' });
    setOpen(true);
  };

  const openEdit = (tag) => {
    setEditingTag(tag);
    setForm({
      name: tag.name || '',
      color: tag.tagColour ?? tag.color ?? '#3b82f6',
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!user?._id) return toast.error('User not loaded yet.');
    const name = form.name.trim();
    const tagColour = form.color || '#3b82f6';
    if (!name) return toast.error('Please enter a tag name.');

    setSaving(true);
    try {
      if (editingTag) {
        await dispatch(
          updateMyTag({
            tagId: editingTag._id,
            data: { name, tagColour }, // <- put fields inside `data`
          })
        ).unwrap();

        toast.success('Tag updated');
      } else {
        await dispatch(
          addMyTag({ userId: user._id, name, tagColour })
        ).unwrap();
        toast.success('Tag created');
      }
      setOpen(false);
      await refetch(); // refresh user.tags
    } catch (e) {
      toast.error(e?.message || 'Failed to save tag');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!user?._id) return toast.error('User not loaded yet.');
    const ok = window.confirm('Archive this tag?'); // soft delete, not permanent
    if (!ok) return;

    setDeletingId(id);
    try {
      await dispatch(removeMyTag(id)).unwrap(); // <-- pass string only
      toast.success('Tag archived');
      await refetch(); // refresh user.tags
    } catch (e) {
      toast.error(e?.message || 'Failed to archive tag');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mt-2 mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tags are visible to everyone in your organization.
          </p>
        </div>
        <div>
          <Button
            onClick={openCreate}
            disabled={saving || !!deletingId || loadingList}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Tag
          </Button>
        </div>
      </div>

      {/* Search */}
      {hasAnyTags && (
        <div className="flex items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tags…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {loadingList && (
            <span className="ml-3 text-xs text-muted-foreground">Loading…</span>
          )}
          {isError && (
            <button
              className="ml-3 text-xs underline"
              onClick={() => refetch()}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loadingList && !hasAnyTags ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-4">
            <span className="inline-flex items-center justify-center w-15 h-15 rounded-full bg-muted-foreground/10">
              <Tag className="h-7 w-7 text-muted-foreground" />
            </span>
            <h2 className="text-lg font-semibold">No tags yet</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Create tags to organize and categorize your content. Tags help you
              track campaigns and analyze performance across your posts.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Tag cards */}
      {!loadingList && hasAnyTags && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tags.map((tag) => {
            const color = tag.tagColour ?? tag.color ?? '#3b82f6';
            return (
              <Card key={tag._id} className="hover:shadow-sm transition">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: color + name */}
                    <div className="flex items-center gap-3">
                      <span
                        className="h-4 w-4 rounded-full ring-2 ring-offset-2"
                        style={{
                          backgroundColor: color,
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
                        }}
                        aria-label="Tag color"
                        title={color}
                      />
                      <div className="font-medium">{tag.name}</div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(tag)}
                        aria-label="Edit tag"
                        title="Edit"
                        disabled={!!deletingId}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tag._id)}
                        aria-label="Delete tag"
                        title="Delete"
                        disabled={deletingId === tag._id}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Empty result for search */}
          {tags.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No tags match “{query}”.
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Tag Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="tag-name" className="text-sm font-medium">
                Tag name
              </label>
              <Input
                id="tag-name"
                placeholder="e.g., Campaign, Ideas"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <label htmlFor="tag-color" className="text-sm font-medium">
                Tag color
              </label>
              <div className="flex items-center gap-3">
                <Input
                  id="tag-color"
                  type="color"
                  className="h-9 w-14 p-1 cursor-pointer"
                  value={form.color}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                />
                <div className="flex items-center gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        className="h-6 w-6 rounded-full ring-2 ring-offset-2"
                        style={{ backgroundColor: c }}
                        title={c}
                        aria-label={`Use ${c}`}
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-2">
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving
                  ? 'Saving…'
                  : editingTag
                  ? 'Save changes'
                  : 'Create tag'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isError && (
        <p className="text-sm text-red-600">
          Failed to load user. Please retry.
        </p>
      )}
      <Toaster richColors position="top-right" />
    </div>
  );
}
