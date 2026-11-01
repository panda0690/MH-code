# MH Code Mobile

Expo + React Native + TypeScript starter for an on-device code editor.

## Run

```bash
npm install
npx expo start
```

Use Expo Go on Android/iOS or an emulator. The first launch creates `index.html`, `styles.css`, `app.js`, and `main.py` in the app's private `document/workspace` directory. Files created in that workspace persist on the device and are not visible to other apps unless you add a document picker/export flow.

## Included

- Expo Router entry point and a TypeScript editor screen
- Workspace file and folder creation, listing, reading, and saving with `expo-file-system`
- Multi-file tabs with unsaved-change dots
- CodeMirror in a WebView with line numbers and HTML, CSS, JavaScript, and Python modes
- Collapsible output panel; JavaScript files can run and send `console.log` output to the panel

## Project layout

```text
app/
  _layout.tsx          Expo Router root layout
  index.tsx            Editor, explorer, tabs, output panel
src/
  components/
    EditorWebView.tsx  CodeMirror WebView bridge
  lib/
    workspace.ts       Local workspace/file operations
  types/
    editor.ts          Shared editor types
app.json               Expo app configuration
package.json           Runtime dependencies and commands
```

## Notes

CodeMirror 5 and its language modes are loaded from cdnjs, so editing requires an internet connection. Python is syntax-highlighted only; it is not executed. The JavaScript Run button executes the active JavaScript source in the app's JS runtime and captures `console.log`; this is a starter output panel, not a shell or isolated sandbox. Use `npx expo install --check` to review Expo SDK package compatibility if your local Expo version differs.
