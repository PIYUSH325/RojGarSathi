import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    const stored = localStorage.getItem('adminSidebarVisible');
    return stored !== null ? stored === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('adminSidebarVisible', sidebarVisible);
  }, [sidebarVisible]);

  return (
    <AdminContext.Provider value={{ sidebarVisible, setSidebarVisible }}>
      {children}
    </AdminContext.Provider>
  );
};
