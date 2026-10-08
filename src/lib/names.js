import { baseName } from './format.js';
export const outName = (file, suffix, ext = 'pdf') => `${baseName(file.name)}${suffix ? `-${suffix}` : ''}.${ext}`;
