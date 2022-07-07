import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Box from '@material-ui/core/Box';

import { MenubarConfigs } from './MenubarConfigs';
import { useContext } from 'react';

var buffer = []
const path_all    = 'json/examples.json'
const path_basics = 'json/examples_basics.json'
const path_FIFA   = 'json/examples_for_FIFA_layout.json'

function jsonToArray(data) {
  var arr = [];
  for (var i = 0; i < data.length; i++) {
    arr.push(data[i]);
  }
  return arr;
}

function jsonToFileList(json) {
  const mapArr = []
  const arr = jsonToArray(json);
  for (var i = 0; i < arr.length; i++) {
    const path = arr[i];
    const fn = path.split('/').pop();
    mapArr.push({filename:fn, filepath:path});
  }
  console.log(mapArr);
  const sorted = mapArr.sort(compareByFilename);
  console.log(sorted);
  return sorted;
}

function compareByFilename(obj_a, obj_b) {
  const fn_a = obj_a.filename.toLowerCase();
  const fn_b = obj_b.filename.toLowerCase();
  var bool = 0;
  if (fn_a > fn_b) { bool = 1; }
  else if (fn_a < fn_b) { bool = -1; }
  return bool;
}

const useStyles = makeStyles((theme) => ({
  viewControl: {
    margin: theme.spacing(1),
    minWidth: 130, // formの最低横幅
  },
}));

const path = path_all
jQuery.getJSON(path, function (data) {
  var arr = jsonToFileList(data);
  for (var i = 0; i < arr.length; i++) {
    buffer.push(<MenuItem value={arr[i].filepath} key={i} >{arr[i].filename}</MenuItem>);
  }
});

export default function SelectSample() {
  const classes = useStyles();
  const [configs, setConfigs] = useContext(MenubarConfigs);

  const handleChange = (event) => {
    setConfigs({
      ...configs,
      selectedSample: event.target.value
    });
    let path = event.target.value;
    if (path) {
      jQuery.get(path,
        function (data) {
          __$__.editor.setValue(data);
          __$__.editor.selection.clearSelection();
        }
      )
    } else {
      alert("Select one the example categories.");
    }
  };

  return (
    <Box mx={1} >
      <FormControl variant="standard" className={classes.viewControl} >
      <InputLabel id="Load sample">Select sample</InputLabel>
      <Select
        labelId="Load sample"
        id="Load sample-helper"
        value={configs.selectedSample}
        // label="Load sample"
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
        {buffer}
      </Select>
      </FormControl>
    </Box>
  );
}