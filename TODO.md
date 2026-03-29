# TODO

## Bugs / changes

- Right click on desktop / file browser (on empty space) - Paste option is missing... should be gray if there is nothing to paste
- Right click on file (on desktop / file browser) - Paste should work only on folder - it will paste coppied files / directories into that directory.. now this option appears on file too (which makes no sense as it would be copying files and directories into a file)
- Test what happens when settings.json file is deleted
- Search in project keyword "svelte-ignore" and remove it, make it properly so it doesn't have to be there
- Right click on desktop throws menu (New file, New directory, Settings) - that's OK, and when clicking outside of it then new menu appears (New file, New directory - without Settings) - why?? Instead it show standard menu with "Sort by, New file, New directory"
- When moving the file with the same name from one directory to another, it should show dialog asking what to do - replace, automatically rename moved / copied files or skip, cancel
- Replace hardcoded colours in all components to theme variables
- Rename colours in theme
- Trash on desktop should be a special type of icon - it should contain empty trash in context menu and should not be deleted in classic way - it should be turned off and on in settings - Desktop - special icons

## Ideas

- All system settings should be in JSON files on OPFS in YellowOS directory
- Apps should have their own separate directories for settings etc.

## New features

- Search files / directories in File browser
- Add File system settings to Settings - File types (list, add, delete, modify)
- For unknown file types show app selection - run just this time / run always
- Show a different icon for empty trash and full trash (when something is inside)
- Add "Empty trash" in context menu for Trash folder only
- When taskbar windows are icon only (withtout text) add tooltip
- Forbid dragging windows outside of screen
- File Browser - drag and drop / upload form from main OS to web OS
- Run WASM files as apps (test the App Player application)
- Add system open / save as ... file dialog
- Text Editor - if user clicks on File -> Exit, if file has unsaved changes, throw Dialog.svelte with question if they want to save it. If file was not saved yet, show file save dialog, if file was saved before changes, just save it and exit
- Use open / save as ... file dialog in Text Editor for opening and saving file as ...
- Use open dialog in app player when clicking on drag area
- File Browser - on right click in directory on empty space - there should be Cut, Copy and Paste buttons. If file is coppied / cut, let it paste as a new file with (copy) in name... if it is is (copy) already, then (copy 2) etc.
- File Browser - add functionality to all menu items when right clicking (long taping) on empty space / icon
- File Browser - allow drag and drop directories and files from one directory to another, right click and drag = context menu copy / move
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
- Image editor (like MS Paint)
- Terminal (for interacting with file system)
- Media player
- Web browser (iframe-based)
- Sticky notes
- Desktop widgets (weather, news etc.)
- Taskbar position in settings + add more panels
- Sounds
- More themes (light, dark etc.)
- API for app development
- Security - app sandboxing, XSS prevention, CSRF protection, API rate limits
- App installer
- App store
- Task manager + app killer
- Create File Manager with 2 panels - like Midnight Commander
- Tauri app?
