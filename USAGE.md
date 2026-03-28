# Usage

## Keyboard shortcuts

> **Why not the standard OS shortcuts?**
> Yellow OS runs inside a web browser, which imposes strict limitations on keyboard shortcuts.
> Many familiar combinations are intercepted by the host operating system or the browser itself and cannot be captured by a web application:
> For this reason, Yellow OS uses following alternative key bindings that do not conflict with the host environment:

### Window management

These shortcuts require a focused (selected) window. Hold **Meta** (Win / Cmd) and press a numpad key:

| Shortcut        | Action                                  |
| --------------- | --------------------------------------- |
| Meta + Numpad 8 | Maximize window                         |
| Meta + Numpad 4 | Snap window to left half                |
| Meta + Numpad 6 | Snap window to right half               |
| Meta + Numpad 7 | Snap window to top-left quarter         |
| Meta + Numpad 9 | Snap window to top-right quarter        |
| Meta + Numpad 1 | Snap window to bottom-left quarter      |
| Meta + Numpad 3 | Snap window to bottom-right quarter     |
| Meta + Numpad 5 | Restore window size                     |
| Meta + Numpad 2 | Minimize window (or restore if snapped) |

### Desktop switching

| Shortcut                   | Action                              |
| -------------------------- | ----------------------------------- |
| Ctrl + Alt + Arrow Left    | Switch to previous desktop          |
| Ctrl + Alt + Arrow Right   | Switch to next desktop              |
| Ctrl + Alt + Numpad number | Switch to specific desktop directly |

### App switcher

| Shortcut    | Action                                        |
| ----------- | --------------------------------------------- |
| Alt + 1     | Open app switcher / cycle backward            |
| Alt + 2     | Open app switcher / cycle forward             |
| Release Alt | Confirm selection and focus the chosen window |

### General

| Shortcut  | Action                                          |
| --------- | ----------------------------------------------- |
| Meta + F4 | Close window                                    |
| Ctrl + A  | Select all icons                                |
| F2        | Rename selected file or directory (single item) |

## Custom files

### `.link` files (shortcuts)

A `.link` file is a JSON file that creates a shortcut to a built-in application. The `.link` extension is hidden on the Desktop and in the Taskbar Menu.

```json
{
  "appId": "calculator",
  "label": "Calculator",
  "icon": "/img/apps/calculator.svg",
  "props": {}
}
```

| Field   | Type   | Required | Description                                       |
| ------- | ------ | -------- | ------------------------------------------------- |
| `appId` | string | yes      | ID of the built-in app (see list below)           |
| `label` | string | yes      | Display name shown under the icon                 |
| `icon`  | string | yes      | Path to the icon image (relative to web root)     |
| `props` | object | no       | Props passed to the app component when opened     |

Available `appId` values: `about`, `app-player`, `calculator`, `file-browser`, `text-editor`, `pong`, `snake`, `settings`.

### `.yapp` files (custom HTML apps)

A `.yapp` file is a JSON manifest that defines a custom application running inside an iframe via the App Player. The app's HTML, CSS, and JS files are stored alongside the manifest on the OPFS file system.

```json
{
  "name": "My App",
  "entry": "index.html",
  "icon": "icon.svg",
  "window": {
    "width": 640,
    "height": 480,
    "minWidth": 200,
    "minHeight": 150,
    "resizable": true,
    "position": "center"
  }
}
```

| Field    | Type   | Required | Description                                              |
| -------- | ------ | -------- | -------------------------------------------------------- |
| `name`   | string | no       | Application name shown in the window titlebar            |
| `entry`  | string | yes      | Path to the HTML entry file (relative to `.yapp` location or absolute from OPFS root) |
| `icon`   | string | no       | Path to the app icon                                     |
| `window` | object | no       | Window configuration (see below)                         |

#### Window options

| Field           | Type    | Default     | Description                           |
| --------------- | ------- | ----------- | ------------------------------------- |
| `width`         | number  | 640         | Initial window width in pixels        |
| `height`        | number  | 480         | Initial window height in pixels       |
| `minWidth`      | number  | 200         | Minimum window width                  |
| `minHeight`     | number  | 150         | Minimum window height                 |
| `maxWidth`      | number  | ∞           | Maximum window width (`null` = no limit) |
| `maxHeight`     | number  | ∞           | Maximum window height (`null` = no limit) |
| `resizable`     | boolean | true        | Whether the window can be resized     |
| `canMinimize`   | boolean | true        | Whether minimize button is shown      |
| `canMaximize`   | boolean | true        | Whether maximize button is shown      |
| `showInTaskbar` | boolean | true        | Whether the window appears in taskbar |
| `position`      | string  | `"default"` | `"default"` (cascade) or `"center"`  |
| `state`         | string  | `"normal"`  | `"normal"`, `"maximized"`, or `"minimized"` |

#### Example directory structure

```
/MyApp/
  myapp.yapp
  index.html
  style.css
  script.js
```

The entry HTML file can reference other files (CSS, JS, images) using relative paths. All `src` and `href` attributes are automatically resolved from OPFS and converted to blob URLs at runtime.
