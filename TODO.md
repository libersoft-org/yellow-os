# TODO

## Bugs / changes

- Replace hardcoded colours in all components to theme variables
- Rename colours in theme

## New features

- Media player
- Text Editor - add document print on printer
- Image Viewer - add image print on printer
- Trash - it's files should be restored if the original directory still exists, if not, throw an error dialog
- Add system open / save as ... file dialog
- Text Editor - if user clicks on File -> Exit, if file has unsaved changes, throw Dialog.svelte with question if they want to save it. If file was not saved yet, show file save dialog, if file was saved before changes, just save it and exit
- Use open / save as ... file dialog in Text Editor for opening and saving file as ...
- App Player - Add open dialog when clicking on drag area
- Image Viewer - Add open dialog for opening the image file
- Wallpaper - Allow find the wallpaper file in file structure using open file dialog (when available)
- Image editor (like MS Paint)
- Terminal (for interacting with file system)
- Web browser (iframe-based)
- Sticky notes
- Desktop widgets (weather, news etc.)
- Taskbar position in settings + add more panels
- System sounds (welcome, dialog error etc.)
- File Browser - Add StatusBar component to the bottom with basic info (useful when right info panel is not opened)
- File Browser - Search files / directories
- File Browser - Add Pack / unpack / browse files and directories into ZIP / other compression formats within OPFS
- Settings - Add File system settings - File types (list, add, delete, modify)
- For unknown file types show app selection - run just this time / run always
- When taskbar windows are icon only (without text) add tooltip
- Forbid dragging windows outside of screen
- Cleanup code
- Tray icons
- Quick launch
- Add win.tray in apps + action on left / right click + double click
- Make a set of components for easy app development - menu bar, input, button, dialog / message box etc.
- Edit README (maybe done) and INSTALL.md
- Add logout screen + button in taskbar menu
- More themes (light, dark etc.)
- API for app development (using system components like buttons, toolbars, dialogs etc.)
- Security - app sandboxing, XSS prevention, CSRF protection, API rate limits
- App installer
- App store
- Task manager + app killer
- Create File Manager with 2 panels - like Midnight Commander
- Tauri app?
