/**
 * SkipLink — accessibility: skip-to-main-content
 * ─────────────────────────────────────────────────
 * Must be the first focusable element on every page.
 * Visible only on keyboard focus.
 */

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
    >
      Skip to main content
    </a>
  );
}
