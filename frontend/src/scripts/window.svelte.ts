// Barrel re-export — all window logic split into focused modules.
// Import from here for backward compatibility, or directly from the sub-modules.

export type { WindowState } from './window-store.svelte';
export { focus, snapPreview, snapAnimatingIds, getWindows, getWindow, openWindow, closeWindow, focusWindow, minimizeWindow, finishMinimize, restoreWindow, toggleMaximize, moveWindow, resizeWindow, defocusAll, isTopWindow, reorderWindow, snapWindow, finishSnapAnimation } from './window-store.svelte';

export type { SnapZone } from './window-snap';
export { getSnapZone, getSnapBounds } from './window-snap';

export type { ResizeDir } from './window-resize.svelte';
export { RESIZE_DIRS, getHandleStyle, createResizeHandler } from './window-resize.svelte';

export { handleKeyboardShortcut } from './window-shortcuts';
