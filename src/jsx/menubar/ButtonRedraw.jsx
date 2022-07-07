import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button'

export default function ButtonRedraw() {
  return (
    <React.Fragment>
      {/* 右寄せ */}
      <div style={{ flexGrow: 1 }} />
      <Button
        variant="outlined"
        // Kanon側のグローバルオブジェクトのフィールドを書き換え
        // 元のRedraw Buttonのonclick属性の実装と同一
        // <input id="redrawButton" ... onclick="__$__.Update.waitForStabilized = false; __$__.Update.ContextUpdate('changed');">
        onClick={
          () => {
            __$__.Update.waitForStabilized = false;
            __$__.Update.ContextUpdate('changed');
          }
        }
      >
        Redraw
      </Button>
    </React.Fragment>
  );
}
  