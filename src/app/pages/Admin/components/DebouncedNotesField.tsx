// src/app/pages/Admin/components/DebouncedNotesField.tsx
// Shared auto-saving notes field used by orders and custom-request panels

import { useState, useEffect } from "react";

interface Props {
  value?: string;
  placeholder: string;
  disabled?: boolean;
  onSave: (nextValue: string) => Promise<void> | void;
}

export function DebouncedNotesField({ value, placeholder, disabled, onSave }: Props) {
  const [draft, setDraft] = useState(value || "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    setDraft(value || "");
    setSaveState("idle");
  }, [value]);

  useEffect(() => {
    if (disabled) return;
    if (draft === (value || "")) return;

    setSaveState("saving");
    const timeoutId = window.setTimeout(async () => {
      try {
        await onSave(draft);
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 1200);
      } catch {
        setSaveState("idle");
      }
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [disabled, draft, onSave, value]);

  return (
    <div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 bg-input-background rounded-lg border border-border min-h-[84px]"
        placeholder={placeholder}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Auto-saves after you stop typing"}
      </p>
    </div>
  );
}
