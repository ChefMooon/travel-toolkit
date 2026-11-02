/**
 * True when `target` is inside a portalled `[role="listbox"]` owned by `root`,
 * i.e. some element inside `root` has `aria-controls` equal to the listbox id.
 * Lets outside-pointer dismiss checks ignore their own nested Select listboxes.
 */
export function isInsideOwnedPortal(target: EventTarget | null, root: HTMLElement | null): boolean {
  if (!root || !(target instanceof Element)) return false;
  const listbox = target.closest('[role="listbox"]');
  if (!listbox?.id) return false;
  return !!root.querySelector(`[aria-controls="${CSS.escape(listbox.id)}"]`);
}
