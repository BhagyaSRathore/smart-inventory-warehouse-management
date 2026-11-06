import React, {createContext, useContext, useState, useCallback} from 'react';

type DrawerContextType = {
  drawerVisible: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const DrawerContext = createContext<DrawerContextType>({
  drawerVisible: false,
  openDrawer: () => {},
  closeDrawer: () => {},
});

export const DrawerProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const openDrawer = useCallback(() => {
    setDrawerVisible(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerVisible(false);
  }, []);

  return (
    <DrawerContext.Provider value={{drawerVisible, openDrawer, closeDrawer}}>
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => useContext(DrawerContext);

export default DrawerContext;
