/** Activate a tap even after pointer capture suppressed a native touch click.
 * The compatibility click must not activate a button in the newly shown screen. */
export function activateTouchButton(button: HTMLButtonElement) {
  const clear = () => {
    clearTimeout(timer);
    document.removeEventListener("click", suppress, true);
    document.removeEventListener("pointerdown", clear, true);
  };
  const suppress = (event: MouseEvent) => {
    if (event.detail === 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    clear();
  };
  const timer = window.setTimeout(clear, 600);
  document.addEventListener("click", suppress, true);
  document.addEventListener("pointerdown", clear, true);
  button.click();
}
