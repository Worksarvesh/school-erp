import * as SecureStore from 'expo-secure-store';

const memoryFallback = new Map<string, string>();

export class SecureStorage {
  private static async isAvailable(): Promise<boolean> {
    try {
      return await SecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  }

  static async setItem(key: string, value: string): Promise<void> {
    const available = await this.isAvailable();
    if (available) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } else {
      memoryFallback.set(key, value);
    }
  }

  static async getItem(key: string, _options?: Record<string, unknown>): Promise<string | null> {
    const available = await this.isAvailable();
    if (available) {
      return await SecureStore.getItemAsync(key);
    }
    return memoryFallback.get(key) || null;
  }

  static async removeItem(key: string): Promise<void> {
    const available = await this.isAvailable();
    if (available) {
      await SecureStore.deleteItemAsync(key);
    } else {
      memoryFallback.delete(key);
    }
  }

  static clearMemoryFallback(): void {
    memoryFallback.clear();
  }
}
