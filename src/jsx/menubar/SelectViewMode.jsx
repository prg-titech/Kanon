import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Box from '@material-ui/core/Box';

import { MenubarConfigs } from './MenubarConfigs';
import { useContext } from 'react';

const useStyles = makeStyles((theme) => ({
  viewControl: {
    margin: theme.spacing(1),
    minWidth: 130, // formの最低横幅
  },
}));

export default function SelectViewMode() {
  const classes = useStyles();
  const [configs, setConfigs] = useContext(MenubarConfigs);

  const handleChange = (event) => {
    setConfigs({
      ...configs,
      viewMode: event.target.value
    });
    // 生のDOM要素を取得して値を書き換え
    // onchange()でKanon側のeventHandlerを強制的に発火 -> see /Kanon/src/js/eventHandler.js
    const target_dom = document.getElementById("pullDownViewMode");
    target_dom.value = event.target.value;
    target_dom.onchange();
  };

  return (
    <Box mx={1} >
      <FormControl variant="standard" className={classes.viewControl} >
      <InputLabel id="viewmode">View mode</InputLabel>
      <Select
        labelId="viewmode"
        id="viewmode-helper"
        value={configs.viewMode}
        label="View Mode"
        onChange={handleChange}
        autoWidth
        MenuProps={{
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "left"
          },
          transformOrigin: {
            vertical: "top",
            horizontal: "left"
          },
          getContentAnchorEl: null
        }}
      >
        <MenuItem value={"Snapshot"}>Snapshot</MenuItem>
        <MenuItem value={"Summarized"}>Summarized</MenuItem>
      </Select>
      </FormControl>
    </Box>
  );
}