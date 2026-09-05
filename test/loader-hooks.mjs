import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

export async function resolve(specifier, context, nextResolve) {
  // Handle '@/...' path aliases
  if (specifier.startsWith('@/')) {
    const subpath = specifier.slice(2);
    let resolvedPath = path.resolve(process.cwd(), 'src', subpath);
    
    if (fs.existsSync(resolvedPath + '.ts')) {
      resolvedPath += '.ts';
    } else if (fs.existsSync(resolvedPath + '.tsx')) {
      resolvedPath += '.tsx';
    } else if (fs.existsSync(resolvedPath + '/index.ts')) {
      resolvedPath += '/index.ts';
    }
    
    return nextResolve(pathToFileURL(resolvedPath).href, context);
  }

  // Handle relative imports without extension (e.g. './medicalDictionary')
  if (specifier.startsWith('.') && context.parentURL && context.parentURL.startsWith('file:')) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const resolvedPath = path.resolve(parentDir, specifier);

    if (!fs.existsSync(resolvedPath)) {
      if (fs.existsSync(resolvedPath + '.ts')) {
        return nextResolve(pathToFileURL(resolvedPath + '.ts').href, context);
      } else if (fs.existsSync(resolvedPath + '.tsx')) {
        return nextResolve(pathToFileURL(resolvedPath + '.tsx').href, context);
      } else if (fs.existsSync(resolvedPath + '/index.ts')) {
        return nextResolve(pathToFileURL(resolvedPath + '/index.ts').href, context);
      }
    }
  }

  return nextResolve(specifier, context);
}
