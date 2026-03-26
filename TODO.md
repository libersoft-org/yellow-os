# TODO

## Bugs / changes

- Replace hardcoded colours in all components to theme variables
- Rename colours in theme

## Ideas

- All system settings should be in JSON files on OPFS in YellowOS directory
- Apps should have their own separate directories for settings etc.

## New features

- Add line numbers to Text Editor
- Add system message box and Yes / No dialog
- Add system open / save as ... file dialog
- Use yes / no dialog in Text Editor - exit warning if file has changed
- Use open / save as ... file dialog in Text Editor for opening and saving file as ...
- File Browser - add functionality to all menu items when right clicking (long taping) on empty space / icon
- File Browser - allow drag and drop directories and files from one folder to another, right click and drag = context menu copy / move
- File Browser - drag and drop / upload form from main OS to web OS
- Run WASM files as apps
- Trash can - use it for delete in File Browser
- Cleanup code
- Tray icons
- Quick launch
- Add win.tray in apps + action on left / right click + double click
- Make a set of components for easy app development - menu bar, input, button, dialog / message box etc.
- Wallpaper change in settings
- Edit README (maybe done) and INSTALL.md
- Add menu bar and use it in apps (File, Edit, Help etc.)
- Add logout screen + button in taskbar menu
- Add shortcut links (as Windows .LNK file) - usable for Taskbar menu and desktop icons
- Add desktop icons (+ grid align)
- Add system settings app
- Add factory reset to system settings, this will remove everything on OPFS:

const root = await navigator.storage.getDirectory();
for await (const name of root.keys()) {
await root.removeEntry(name, { recursive: true });
}

- Serverless data synchronization between devices
- Photo viewer
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
- Create File Manager with 2 panels - like Midnight Commander
- Tauri app?
