import React from 'react';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';

import { MenubarConfigs } from './MenubarConfigs';
import { useContext } from 'react';

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiTextField-root': {
      margin: theme.spacing(1),
      width: 70,
    },
  },
}));

export default function TextFieldFontSize() {
  const classes = useStyles();
  // const [currentFontSize, setFontSize] = React.useState("12");
  const [configs, setConfigs] = useContext(MenubarConfigs);

  const handleChange = (event) => {
    setConfigs({
      ...configs,
      fontSize: event.target.value
    });
    // 生のDOM要素を取得して値を書き換え
    const target_dom = document.getElementById('fontSize');
    target_dom.value = event.target.value;
    __$__.FontSizeUpdate();
  };

  return (
    <form className={classes.root} noValidate autoComplete="off">
      <div>
        <Box mx={1} sx={{ minWidth: 140 }} textAlign="center" >
          <TextField
            inputProps={{ maxLength: 2, pattern: "^[0-9]+$" }}
            id="standard-error-helper-text"
            label="Font size"
            value={configs.fontSize}
            onChange={handleChange}
          />
        </Box>
      </div>
    </form>
  );
}
