import { createContext, useContext, type ReactNode } from 'react';

import { useKeyboardBottomInset } from '../hooks/useKeyboardBottomInset';

const KeyboardInsetContext = createContext(0);

export function useKeyboardInset(): number {
  return useContext(KeyboardInsetContext);
}

export function KeyboardInsetProvider({ children }: { children: ReactNode }) {
  const inset = useKeyboardBottomInset();
  return (
    <KeyboardInsetContext.Provider value={inset}>{children}</KeyboardInsetContext.Provider>
  );
}
