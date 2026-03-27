# TODO

## Bugs / changes

- When moved directory from desktop to File browser and then tried to move it to empty space in the same file browser, it doesnt move (other icons that were in the same directory are movable OK)
- Search in project keyword "svelte-ignore" and remove it, make it properly so it doesn't have to be there
- AppPlayer - should not use UTF8 icon - <div class="drop-icon">📦</div>, use <Icon> - app icon instead
- After factory reset the system reloads and shows desktop with no icons. on next reload it appears correctly
- If dragging icon over something non-dropable add extra no-go subicon on dragged item (folder, file etc.)
- Right click on desktop throws menu (New file, New directory, Settings) - that's OK, and when clicking outside of it then new menu appears (New file, New directory - without Settings) - why??
- File browser and desktop - right click on empty space -> new directory / file - the new icon should appear on the spot where I right clicked
- File browser - right click dragging some folder or directory doesn't show context menu (Move here, Copy here)
- When moving the file with the same name from one folder to another, it should show dialog asking what to do - replace, automatically rename moved / copied files or skip, cancel
- Pong -> Click on maximize button -> then press space - it restores it instead of playing... it looks like there is a focus on window control buttons, which should not be, it's for mouse only
- Replace hardcoded colours in all components to theme variables
- Rename colours in theme

## Ideas

- All system settings should be in JSON files on OPFS in YellowOS directory
- Apps should have their own separate directories for settings etc.

## New features

- Forbid moving / renaming / deleting Trash directory
- Forbid dragging windows outside of screen
- File Browser - drag and drop / upload form from main OS to web OS
- Run WASM files as apps
- Add system open / save as ... file dialog
- Text Editor - if user clicks on File -> Exit, if file has unsaved changes, throw Dialog.svelte with question if they want to save it. If file was not saved yet, show file save dialog, if file was saved before changes, just save it and exit
- Use open / save as ... file dialog in Text Editor for opening and saving file as ...
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
