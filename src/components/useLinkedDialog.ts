import { useEffect } from "react";

/** Keep keyboard navigation inside the lesson options and restore its trigger. */
export default function useLinkedDialog(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>(".linked-settings");
    const buttons = () => [...(dialog?.querySelectorAll<HTMLElement>("button:not(:disabled), [tabindex='0']") ?? [])];
    buttons()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key !== "Tab") return;
      const items = buttons(), first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); trigger?.focus(); };
  }, [open]);
}
