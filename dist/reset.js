import { STORAGE_KEY } from './age.js';
import { NOTES_KEY } from './notes.js';
import { CHAT_ARCHIVE_KEY } from './chat-storage.js';
// Explicit owner request: reset personal data once, then preserve the new setup.
export const RESET_KEY='ppm-test-reset';
export const RESET_REVISION='fresh-start-2026-11-19.2';
export function resetForFreshStart(storage,force=false) {
  if(!force&&storage.getItem(RESET_KEY)===RESET_REVISION)return false;
  for(const key of [STORAGE_KEY,NOTES_KEY,CHAT_ARCHIVE_KEY,'ppm-calculator-v1'])storage.removeItem(key);
  storage.setItem(RESET_KEY,RESET_REVISION);
  return true;
}
