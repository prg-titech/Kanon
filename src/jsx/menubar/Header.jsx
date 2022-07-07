import * as React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import SelectViewMode from './SelectViewMode.jsx';
import PreferenceMenu from './PreferenceMenu.jsx';
import ButtonRedraw from './ButtonRedraw.jsx';

import { MenubarConfigsProvider } from './MenubarConfigs.jsx';

import SelectSample from './SelectSample.jsx';

function CustomCheckBox(props) {
  return (
    <FormControlLabel control={
      <Checkbox
        defaultChecked
        color="default"
      />} label={props.label} />
  );
}

export default function ButtonAppBar() {

  return (
    <MenubarConfigsProvider>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar color='default' position="static">
          <Toolbar>
            <PreferenceMenu />
            <Typography variant="h6" component="div"> Kanon </Typography>
            <SelectViewMode />
            <SelectSample />

            <div id="selectClass"></div>
            {/* <CustomCheckBox label="a" />
            <CustomCheckBox label="a" />
            <CustomCheckBox label="a" /> */}

            <ButtonRedraw />
          </Toolbar>
        </AppBar>
      </Box>
    </MenubarConfigsProvider>
  );
}