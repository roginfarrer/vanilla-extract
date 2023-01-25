import { posix, relative, sep } from 'path';

/**
 * Regex to capture ESM style imports
 * Greedily will capture any statement that starts with "import ..."
 */
const esmImportRegex = /^ *import .*/gm;

/**
 * Regex to capture ESM style imports
 * ' *' captures additional whitespace
 *
 * Captures
 * - export default Foo ...
 * - export const Foo ...
 * - export {Foo ...
 * - export { Foo ...
 */
const esmExportRegex = /^ *export *(const *\w+|default *\w+|\{ *\w+)/gm;

interface AddFileScopeParams {
  source: string;
  filePath: string;
  rootPath: string;
  packageName: string;
}
export function addFileScope({
  source,
  filePath,
  rootPath,
  packageName,
}: AddFileScopeParams) {
  // Encode windows file paths as posix
  const normalizedPath = posix.join(...relative(rootPath, filePath).split(sep));

  if (source.indexOf('@vanilla-extract/css/fileScope') > -1) {
    return source.replace(
      /setFileScope\(((\n|.)*?)\)/,
      `setFileScope("${normalizedPath}", "${packageName}")`,
    );
  }

  let isESM = false;
  if (esmImportRegex.test(source) || esmExportRegex.test(source)) {
    isESM = true;
  }

  if (isESM) {
    return `
      import { setFileScope, endFileScope } from "@vanilla-extract/css/fileScope";
      setFileScope("${normalizedPath}", "${packageName}");
      ${source}
      endFileScope();
    `;
  }
  return `
    const __vanilla_filescope__ = require("@vanilla-extract/css/fileScope");
    __vanilla_filescope__.setFileScope("${normalizedPath}", "${packageName}");
    ${source}
    __vanilla_filescope__.endFileScope();
  `;
}
