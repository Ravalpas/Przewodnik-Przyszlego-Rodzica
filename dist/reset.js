import { STORAGE_KEY } from './age.js';
// One-time reset explicitly requested for this test release. New profiles survive later reloads.
export const RESET_KEY='ppm-test-reset';
export const RESET_REVISION='completed-stages-2026-11-10';
export function resetForFreshStart(storage) {
  if(storage.getItem(RESET_KEY)===RESET_REVISION)return false;
  storage.removeItem(STORAGE_KEY);
  storage.setItem(RESET_KEY,RESET_REVISION);
  return true;
}
