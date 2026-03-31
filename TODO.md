# TODO

## Bugs / changes

- Trash on desktop shouldn't be a shortcut, but a special type of icon (like in Windows), in settings -> Desktop there should be a category for desktop icons - for now there will be just 1 option - Trash. If enabled (default) then we have a replication of "Trash" folder on desktop which is not a shortcut (link), but should behave like an ordinary folder that's in OPFS
- When moving the file with the same name from one directory to another, it should show dialog asking what to do - replace, automatically rename moved / copied files or skip, cancel
- Replace hardcoded colours in all components to theme variables
- Rename colours in theme

## New features

- File Browser - drag and drop / upload form from main OS to web OS
- Trash - it's files should be restored if the original directory still exists, if not, throw an error dialog
- Run WASM files as apps (test the App Player application)
- Add system open / save as ... file dialog
- Text Editor - if user clicks on File -> Exit, if file has unsaved changes, throw Dialog.svelte with question if they want to save it. If file was not saved yet, show file save dialog, if file was saved before changes, just save it and exit
- Use open / save as ... file dialog in Text Editor for opening and saving file as ...
- Use open dialog in app player when clicking on drag area
- Show a different icon for empty trash and full trash (when something is inside)
- Add "Empty trash" in context menu for Trash folder only
- Image viewer
- Image editor (like MS Paint)
- Terminal (for interacting with file system)
- Media player
- Web browser (iframe-based)
- Sticky notes
- Desktop widgets (weather, news etc.)
- Taskbar position in settings + add more panels
- Sounds
- Search files / directories in File browser
- Add File system settings to Settings - File types (list, add, delete, modify)
- For unknown file types show app selection - run just this time / run always
- When taskbar windows are icon only (withtout text) add tooltip
- Forbid dragging windows outside of screen
- File Browser - Add Pack / unpack / browse files and folders into ZIP / other compression formats within OPFS
- Cleanup code
- Tray icons
- Quick launch
- Add win.tray in apps + action on left / right click + double click
- Make a set of components for easy app development - menu bar, input, button, dialog / message box etc.
- Edit README (maybe done) and INSTALL.md
- Add logout screen + button in taskbar menu
- More themes (light, dark etc.)
- API for app development
- Security - app sandboxing, XSS prevention, CSRF protection, API rate limits
- App installer
- App store
- Task manager + app killer
- Create File Manager with 2 panels - like Midnight Commander
- Tauri app?
