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
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120, // formの最低横幅
  },
}));

export default function SelectDrawingMethod() {
  const classes = useStyles();
  const [configs, setConfigs] = useContext(MenubarConfigs);

  const handleChange = (event) => {
    setConfigs({
      ...configs,
      drawingMethod: event.target.value
    });
    // 生のDOM要素を取得して値を書き換え
    const target_dom = document.getElementById("SelectDrawMethod");
    target_dom.value = event.target.value;
  };

  return (
    <Box mx={1} textAlign="center" >
      <FormControl variant="standard" className={classes.formControl} >
      <InputLabel id="drawingmethod">Drawing method</InputLabel>
      <Select
        labelId="drawingmethod"
        id="drawingmethod-helper"
        value={configs.drawingMethod}
        label="Drawing Method"
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
        <MenuItem value={"FiFA"}>FiFA</MenuItem>
        <MenuItem value={"Original"}>Original</MenuItem>
      </Select>
      </FormControl>
    </Box>
  );
}