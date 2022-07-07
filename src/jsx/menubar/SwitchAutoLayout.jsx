import React from 'react';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import Box from '@material-ui/core/Box';

import { MenubarConfigs } from './MenubarConfigs';
import { useContext } from 'react';

export default function SwitchAutoLayout() {
  const [configs, setConfigs] = useContext(MenubarConfigs);
  
  const handleChange = (event) => {
    setConfigs({
      ...configs,
      autoLayout: event.target.checked
    });
    // 生のDOM要素を取得して値を書き換え
    // onchange()でKanon側のeventHandlerを強制的に発火 -> see /Kanon/src/js/eventHandler.js
    // DOM要素で値を管理していないようなので書き換えは無意味。onchangeの発火だけができれば十分。
    const target_dom = document.getElementById('autoLayout');
    target_dom.checked = event.target.checked;
    target_dom.onchange();
  };

  return (
    <Box mx={1} textAlign="center" >
      <FormControl component="fieldset">
        <FormControlLabel
          value="on"
          control={
            <Switch
              color="primary"
              checked={configs.autoLayout}
              onChange={handleChange}
            />
          }
          label="Auto layout"
          labelPlacement="start"
        />
      </FormControl>
    </Box>
  );
}
