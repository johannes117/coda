import keytar from 'keytar';

const SERVICE = 'coda';
const ACCOUNT = 'openrouter-api-key';

export async function getStoredApiKey(): Promise<string | null> {
  try {
    return await keytar.getPassword(SERVICE, ACCOUNT);
  } catch {
    return null;
  }
}

export async function storeApiKey(key: string): Promise<void> {
  try {
    await keytar.setPassword(SERVICE, ACCOUNT, key);
  } catch (e) {
    console.error('Failed to store API key securely:', e);
  }
}

export async function deleteStoredApiKey(): Promise<void> {
  try {
    await keytar.deletePassword(SERVICE, ACCOUNT);
  } catch (e) {
    console.error('Failed to delete API key:', e);
  }
}
