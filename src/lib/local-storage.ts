// Persisting Redux state to local storage, credit to:
// https://egghead.io/lessons/javascript-redux-persisting-the-state-to-the-local-storage

// Let loadState return "any" since the type varies so much
// eslint-disable-next-line
export const loadState = (key: string): any => {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

export const saveState = (key: string, state: unknown): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(key, serializedState);
  } catch (err) {
    // ignore write errors
  }
};
