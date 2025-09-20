#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import pkg from '../package.json' assert { type: 'json' };

// Support both ESM and CJS at runtime
declare const __dirname: string | undefined;

const program = new Command();

program
  .name('rage-console')
  .description('CLI для @xvantz/rage-console')
  .version(pkg.version);

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const st = fs.statSync(s);
    if (st.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function findClientPackagesRoot(startDir: string): string | null {
  let current = path.resolve(startDir);
  const { root } = path.parse(current);
  while (true) {
    const candidate = path.join(current, 'client_packages');
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return current;
    }
    if (current === root) break;
    current = path.dirname(current);
  }
  return null;
}

program
  .command('init')
  .argument('[dir]', 'куда развернуть UI файлы. Если не указано, будет найден ближайший client_packages; внутри него будет создана папка interface/customConsole. Если client_packages не найден — команда завершится с ошибкой', '')
  .action((dir: string) => {
    try {
      const runtimeDir = typeof __dirname === 'string' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
      const source = path.resolve(runtimeDir, '..', 'ui-static');

      if (!fs.existsSync(source)) {
        console.error('Папка с UI не найдена: ui-static');
        process.exit(1);
      }

      let target: string;
      if (dir && dir.trim()) {
        target = path.resolve(process.cwd(), dir);
      } else {
        const rootWithClientPackages = findClientPackagesRoot(process.cwd());
        if (!rootWithClientPackages) {
          console.error('Не удалось найти папку "client_packages" в текущей директории или любом из родительских каталогов.\n' +
            'Укажите целевую директорию аргументом, например: console init client_packages/interface/customConsole');
          process.exit(1);
        }
        const baseDir = path.join(rootWithClientPackages, 'client_packages');
        target = path.join(baseDir, 'interface', 'customConsole');
      }

      fs.mkdirSync(target, { recursive: true });
      copyDir(source, target);
      console.log('✔ UI файлы развернуты в', path.relative(process.cwd(), target));
    } catch (err) {
      console.error('Ошибка при развёртывании UI:', err);
      process.exit(1);
    }
  });

program.parse();