# TODO

## Bugs / changes

- On desktop / file browser - if i right click on something and select "cut" and then paste it in the same directory, it just changes its name. Instead of renaming in this screnario, just move icons to a place where it should be pasted
- Trash on desktop should be a special type of icon - it should contain empty trash in context menu and should not be deleted in classic way - it should be turned off and on in settings - Desktop - special icons
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
