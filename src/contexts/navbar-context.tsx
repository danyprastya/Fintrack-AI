"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface NavbarContextType {
  visible: boolean;
  hide: () => void;
  show: () => void;
}

const NavbarContext = createContext<NavbarContextType>({
  visible: true,
  hide: () => {},
  show: () => {},
});

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const hide = useCallback(() => setVisible(false), []);
  const show = useCallback(() => setVisible(true), []);

  return (
    <NavbarContext.Provider value={{ visible, hide, show }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  return useContext(NavbarContext);
}
