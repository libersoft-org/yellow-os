# TODO

## Bugs / changes

- TaskbarMenuItem is basically the same as FileManagerSidebar items. Unify it in generic component (including animations as they are in TaskbarMenuItem)
- When resizing Snake and Pong game window, it should not create a bigger gameplay area, but rather scale it. Keep aspect ratio.
- Replace hardcoded colours in all components to theme variables
- Rename colours in theme
- Unify fonts for the whole OS (mono and non-mono)

## New features

- Key shortcuts - ALT + F4, ALT + TAB, WIN + left / right (snap) (suppress host system shortcuts!)
- Click on window title bar icon should show context menu - maximize, minimize, restore, close, double click to close
- Create a generic list items - use in File manager in left column, in System settings etc.
- File manager - add file / directory info in right panel
- File manager - create a new generic component - ContextMenu a ContextMenuItem - use it for right click (long tap on mobile) to bring up the menu with: copy, cut, paste, rename, delete, open, open in new window (directory only)
- File manager - right click (long tap) on empty space in FileManagerGrid - menu with submenu - Sort by - Name, modification date, type, size (+ asc / desc), new file, new directory
- File manager - in top toolbar add switch grid / list view (2 icons)
- File manager - connect with OPFS
- File manager - rename to File browser (File Manager will be something else - 2 panel like Midnight Commander)
- File manager - allow drag and drop directories and files from one folder to another, even inter-process (between 2 file browsers), right click = context menu copy / move
- Trash can
- Cleanup code
- Tray icons
- Quick launch
- Each application should be able to choose initial position - default, center screen, maximized, minimized, tray
- Make a set of components for easy app development - menu bar, input, button, dialog / message box etc.
- Wallpaper change in settings
- When right click on icon in Window component - show context menu - maximize / minimize / restore / close
- Edit README (maybe done) and INSTALL.md
- Add menu bar and use it in apps (File, Edit, Help etc.)
- Add logout screen + button in taskbar menu
- Add categories in taskbar menu
- Add shortcut links (as Windows .LNK file) - usable for Taskbar menu and desktop icons
- Add desktop icons (+ grid align)
- Add system settings app
- Create file manager with 2 panels - like Midnight Commander
- Serverless data synchronization between devices
- Photo viewer
- Drag and drop / upload form from main OS to web OS
- Terminal (for interacting with file system)
- Media player
- Web browser (iframe-based)
- Sticky notes
- Desktop widgets (weather, news etc.)
- Taskbar position in settings + add more panels
- Notification system - toast
- Sounds
- More themes (light, dark etc.)
- API for app development
- Security - app sandboxing, XSS prevention, CSRF protection, API rate limits
- App installer
- App store
- Task manager + app killer
- Tauri app?
