import { STORAGE_KEY } from './age.js';
import { NOTES_KEY } from './notes.js';
const CHAT_ARCHIVE_KEY='ppm-bielik-conversations-v1'; // Cleanup of old personal data only.
// Explicit owner request: reset personal data once, then preserve the new setup.
export const RESET_KEY='ppm-test-reset';
export const RESET_REVISION='fresh-start-2026-11-22.1';
export function resetForFreshStart(storage,force=false) {
  if(!force&&storage.getItem(RESET_KEY)===RESET_REVISION)return false;
  for(const key of [STORAGE_KEY,NOTES_KEY,CHAT_ARCHIVE_KEY,'ppm-calculator-v1','ppm-records-v1'])storage.removeItem(key);
  storage.setItem(RESET_KEY,RESET_REVISION);
  return true;
}
