const TOKEN_KEY = "recall_extension_jwt";

function getChromeStorage() {
  return chrome?.storage?.local;
}

export async function getStorageValue<T>(key: string): Promise<T | null> {
  const storage = getChromeStorage();
  if (!storage) return null;

  return new Promise((resolve) => {
    storage.get([key], (result) => {
      resolve((result?.[key] as T | undefined) ?? null);
    });
  });
}

export async function setStorageValue<T>(key: string, value: T): Promise<void> {
  const storage = getChromeStorage();
  if (!storage) return;

  return new Promise((resolve) => {
    storage.set({ [key]: value }, () => resolve());
  });
}

export async function removeStorageValue(key: string): Promise<void> {
  const storage = getChromeStorage();
  if (!storage) return;

  return new Promise((resolve) => {
    storage.remove([key], () => resolve());
  });
}

export async function getJwtToken(): Promise<string | null> {
  return getStorageValue<string>(TOKEN_KEY);
}

export async function setJwtToken(token: string): Promise<void> {
  await setStorageValue(TOKEN_KEY, token);
}

export async function clearJwtToken(): Promise<void> {
  await removeStorageValue(TOKEN_KEY);
}
