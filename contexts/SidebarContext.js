// SidebarContext.jsx
import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [rightSidebarKey, setRightSidebarKey] = useState(null);

  return (
    <SidebarContext.Provider value={{ rightSidebarKey, setRightSidebarKey }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useRightSidebar = () => useContext(SidebarContext);
