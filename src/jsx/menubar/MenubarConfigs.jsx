import React, { createContext, useState } from 'react';

// Menu全体の設定
export const MenubarConfigs = createContext([
  { 
    fontSize: 12,
    autoLayout: true,
    drawingMethod: 'FiFA',
    viewMode: 'Snapshot',
    selectedSample: ''
  } , () => {}
]);

export function MenubarConfigsProvider(props) {
  const [configs, setConfigs] = useState({
    fontSize: 12,
    autoLayout: true,
    drawingMethod: 'FiFA',
    viewMode: 'Snapshot',
    selectedSample: ''
  });

  return (
    <MenubarConfigs.Provider value={[configs, setConfigs]}>
      {props.children}
    </MenubarConfigs.Provider>
  );
}