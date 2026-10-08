// Memory storage fallback aman untuk React Native / Expo
const memoryStorage: Record<string, string> = {
  isLoggedIn: "true",
  userEmail: "admin@invengo.com",
};

export const getLocalStorage = async (key: string): Promise<string | null> => {
  try {
    return memoryStorage[key] ?? null;
  } catch (error) {
    console.error("Error reading storage:", error);
    return null;
  }
};

export const removeLocalStorage = async (key: string): Promise<void> => {
  try {
    delete memoryStorage[key];
  } catch (error) {
    console.error("Error removing storage:", error);
  }
};

export const setLocalStorage = async (
  key: string,
  value: string,
): Promise<void> => {
  try {
    memoryStorage[key] = value;
  } catch (error) {
    console.error("Error setting storage:", error);
  }
};
