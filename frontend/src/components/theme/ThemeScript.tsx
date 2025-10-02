// Script to prevent flash of unstyled content (FOUC) when loading theme
// This runs before React hydration to set the theme immediately
export function ThemeScript() {
  const script = `
    (function() {
      try {
        const storageKey = 'congresstracker-theme';
        const theme = localStorage.getItem(storageKey) || 'system';
        const root = document.documentElement;

        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'light') {
          root.classList.remove('dark');
        } else {
          // System theme
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      } catch (e) {
        // If localStorage is not available, fall back to system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
