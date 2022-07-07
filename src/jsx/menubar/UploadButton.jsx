import React, { useState, useCallback } from "react"

import Button from '@material-ui/core/Button';
import BackupIcon from '@material-ui/icons/Backup';

export default function UploadButton() {

  function readSingleFile(evt) {
    //Retrieve the first (and only!) File from the FileList object
    const f = evt.target.files[0];
  
    if (f) {
      const r = new FileReader();
      r.onload = function(e) {
        const contents = e.target.result;
        __$__.editor.setValue(contents);
        __$__.editor.selection.clearSelection();
      };
      r.readAsText(f);
  
    } else {
      alert("Failed to load file");
    }
  };

  const handleClick = (event) => {
    const f = document.getElementById('upload-button').addEventListener('change', readSingleFile, false);
  };

  return (
    <label htmlFor="upload-button">
      <input
        style={{ display: "none" }}
        id="upload-button"
        name="upload-button"
        type="file"
      />
      <Button
        component="span"
        variant="outlined"
        startIcon={<BackupIcon />}
        onClick={handleClick}
      >
        Upload
      </Button>
    </label>
  );
}