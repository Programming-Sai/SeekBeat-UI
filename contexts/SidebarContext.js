// SidebarContext.jsx
import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext({
  rightSidebarKey: null,
  setRightSidebarKey: () => {},
});

export function SidebarProvider({ children }) {
  const [rightSidebarKey, setRightSidebarKey] = useState(null);

  return (
    <SidebarContext.Provider value={{ rightSidebarKey, setRightSidebarKey }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useRightSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useRightSidebar must be used within a SidebarProvider");
  }
  return ctx;
};
