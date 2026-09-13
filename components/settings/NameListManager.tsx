"use client";

import { useState, type FormEvent } from "react";
import { Check, Pencil, Plus, Trash, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { RemoveResult } from "@/lib/store";
import { Button, IconButton } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";

interface Item {
  id: string;
  name: string;
}

/** Generic add / rename / remove list used for accounts and categories. */
export function NameListManager({ items, onAdd, onRename, onRemove, placeholder, inUseMessage, colorFor }: {
  items: Item[];
  onAdd: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onRemove: (id: string) => Promise<RemoveResult>;
  placeholder: string;
  inUseMessage: string;
  colorFor?: (index: number) => string;
}) {
  const { t } = useI18n();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [arm, setArm] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    await onAdd(newName);
    setNewName("");
    setBusy(false);
  };

  const saveRename = async (id: string) => {
    if (!editName.trim()) return;
    setBusy(true);
    await onRename(id, editName);
    setEditing(null);
    setBusy(false);
  };

  const remove = async (id: string) => {
    if (arm !== id) {
      setArm(id);
      setTimeout(() => setArm((a) => (a === id ? null : a)), 4000);
      return;
    }
    setBusy(true);
    const res = await onRemove(id);
    setBusy(false);
    setArm(null);
    if (!res.ok) {
      setMsg(inUseMessage);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  return (
    <div>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-center gap-2 rounded-2xl bg-cream/70 px-3 py-2">
            {colorFor && <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: colorFor(i) }} />}
            {editing === item.id ? (
              <>
                <input
                  className={`${inputClass} py-2`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveRename(item.id);
                    if (e.key === "Escape") setEditing(null);
                  }}
                  autoFocus
                />
                <IconButton onClick={() => saveRename(item.id)} aria-label={t("common.save")} className="text-income">
                  <Check className="h-5 w-5" />
                </IconButton>
                <IconButton onClick={() => setEditing(null)} aria-label={t("common.cancel")}>
                  <X className="h-5 w-5" />
                </IconButton>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate font-bold">{item.name}</span>
                <IconButton onClick={() => { setEditing(item.id); setEditName(item.name); }} aria-label={t("common.rename")}>
                  <Pencil className="h-4 w-4" />
                </IconButton>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  disabled={busy}
                  className={`flex h-10 items-center gap-1 rounded-full px-3 text-sm font-bold transition ${arm === item.id ? "bg-danger text-white" : "text-ink-soft hover:bg-danger-soft hover:text-danger"}`}
                  aria-label={t("common.delete")}
                >
                  <Trash className="h-4 w-4" />
                  {arm === item.id && t("common.really")}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {msg && <p className="mt-2 text-sm font-semibold text-danger">{msg}</p>}
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input className={`${inputClass} py-2`} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={placeholder} />
        <Button type="submit" variant="secondary" loading={busy} disabled={!newName.trim()}>
          <Plus className="h-4 w-4" />
          {t("common.add")}
        </Button>
      </form>
    </div>
  );
}
