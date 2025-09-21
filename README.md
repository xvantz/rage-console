# @xvantz/rage-console

A unified, lightweight console logger for RAGE:MP that works across Client, Server and CEF (UI) with a shared on‑screen console UI.

This package also ships a CLI to deploy the bundled UI into your RAGE:MP project structure.

## Features
- One API for Client, Server, UI and Local environments
- Buffered UI logging with safe calls and error fallbacks
- Ready‑to‑use in‑game console UI (CEF) included
- Simple CLI to deploy the UI assets to your project
- TypeScript support and typings included

## Installation
```
npm install @xvantz/rage-console
```

## Quick start (library)
```ts
import CustomConsole from '@xvantz/rage-console';

const log = new CustomConsole('MyFeature', 46);
log.info('Hello from client!');
log.warn({ data: 123 });
log.error('Something went wrong');
```

## Deploying the UI with the CLI
This package includes a CLI named `rage-console` with the `init` command that deploys the UI files.

- If you pass a directory argument, files will be copied there.
- If you do not pass an argument, the CLI will walk up from the current directory to find the nearest existing `client_packages` directory. If found, it will create (if missing) `interface/customConsole` inside it and deploy the UI there.
- If no `client_packages` directory is found, the command exits with an error and asks you to specify a target directory explicitly.

Examples:
```
# from your project root (where client_packages exists somewhere above or here)
npx rage-console init

# deploy to a specific folder
npx rage-console init client_packages/interface/customConsole
```

After deployment, the UI becomes available at:
```
package://interface/customConsole/index.html
```
which the library uses by default for the shared browser console.

### Important: create the console after your main browser
- RAGE:MP layers CEF browsers by creation order. If you create the console first and then create your app's main Browser, the console UI will be rendered underneath the main browser and will not be visible.
- Therefore, instantiate the console after your main Browser is created (or recreate it after your main Browser).

Example (client):
```js
// Create your main UI first
const main = new mp.browser.new('package://myui/index.html');

// Then create/use the console
import CustomConsole from '@xvantz/rage-console';
const log = new CustomConsole('MyFeature');
log.info('Console is on top now');
``` 

## Scripts
- Build the package (dist + UI build for template):
```
npm run build
```

## Project structure (high level)
- `src/` — library source (TypeScript)
- `ui-static/` — prebuilt UI assets deployed by the CLI
- `dist/` — compiled library and CLI output

## Contributing
Contributions via pull requests are welcome. Please open an issue or a draft PR to discuss significant changes first. By submitting a contribution, you confirm you have the rights to contribute the code and you grant the project owner the rights described in the license.

## License
This project is licensed under the Elastic License 2.0 (ELv2). See the LICENSE file for the full text. In brief: you may use, modify, create derivative works, and distribute the software; however, you may not provide the software to third parties as a managed service, and you may not circumvent license protections. The source remains under ELv2 for derivative works. This is not an open‑source (OSI‑approved) license.

## Support
If you encounter issues, please open an issue in the repository or submit a pull request with a fix.
