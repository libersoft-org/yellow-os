# TODO

## Bugs / changes

- Replace hardcoded colours in all components to theme variables
- Rename colours in theme

## Ideas

- All system settings should be in JSON files on OPFS in YellowOS directory
- Apps should have their own separate directories for settings etc.

## New features

- File Browser - drag and drop / upload form from main OS to web OS
- Run WASM files as apps
- Add system open / save as ... file dialog
- Text Editor - if user clicks on File -> Exit, if file has unsaved changes, throw Dialog.svelte with question if they want to save it. If file was not saved yet, show file save dialog, if file was saved before changes, just save it and exit
- Use open / save as ... file dialog in Text Editor for opening and saving file as ...
- File Browser - on right click in directory on empty space - there should be Cut, Copy and Paste buttons. If file is coppied / cut, let it paste as a new file with (copy) in name... if it is is (copy) already, then (copy 2) etc.
- File Browser - add functionality to all menu items when right clicking (long taping) on empty space / icon
- File Browser - allow drag and drop directories and files from one folder to another, right click and drag = context menu copy / move
- Trash can - use it for delete in File Browser and on desktop
- Cleanup code
- Tray icons
- Quick launch
- Add win.tray in apps + action on left / right click + double click
- Make a set of components for easy app development - menu bar, input, button, dialog / message box etc.
- Edit README (maybe done) and INSTALL.md
- Add menu bar and use it in apps (File, Edit, Help etc.)
- Add logout screen + button in taskbar menu
- Add desktop icons (+ grid align)
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
