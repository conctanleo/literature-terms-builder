import { DatabaseConfig } from "./types";
import { databaseRegistry } from "./registry";

const STORAGE_KEY = "searchbuilder-custom-dbs";

export function getCustomDatabases(): DatabaseConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomDatabase(config: DatabaseConfig): void {
  const customs = getCustomDatabases();
  const idx = customs.findIndex((c) => c.id === config.id);
  if (idx >= 0) customs[idx] = config;
  else customs.push(config);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
}

export function removeCustomDatabase(id: string): void {
  const customs = getCustomDatabases().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
}

export function getAllDatabasesWithCustom(): DatabaseConfig[] {
  const builtin = Object.values(databaseRegistry);
  const customs = getCustomDatabases();
  return [...builtin, ...customs];
}
