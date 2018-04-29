import { put } from 'redux-saga/effects';
import { trimLeft } from 'utils/stringUtils';

import { launchFullscreen } from 'utils/fullscreen';

function* handleKeyPressed(event, evt, uid, config) {
  const { keypressSubscriptions } = config;
  const {
    key, altKey, metaKey, ctrlKey, shiftKey, repeat,
  } = evt;
  if (event === 'keyup') {
    if (key === 'Alt') {
      yield put({
        type: 'KEY_ALT_UP',
      });
    } else if (key === 'Shift') {
      yield put({
        type: 'KEY_SHIFT_UP',
      });
    }
    return;
  } else if (key === 'Alt') {
    yield put({
      type: 'KEY_ALT_DOWN',
    });
    return;
  } else if (key === 'Shift') {
    yield put({
      type: 'KEY_SHIFT_DOWN',
    });
    return;
  }

  // console.log(key, altKey, metaKey, ctrlKey, shiftKey);
  // console.log(keypressSubscriptions.has(key))

  if (keypressSubscriptions && !keypressSubscriptions.has(key)) {
    return;
  }

  const meta = {
    key,
    altKey,
    metaKey,
    ctrlKey,
    shiftKey,
    repeat,
  };

  switch (key) {
    case ' ': {
      yield put({
        type: 'MAIN_MENU',
        toggle: true,
      });
      break;
    }
    case 'Escape': {
      // Dispatch escape event for any interested listeners
      return yield put({
        type: 'KEY_ESCAPE',
        ...meta,
      });
    }
    case 'Enter': {
      return yield put({
        type: 'KEY_ENTER',
        ...meta,
      });
    }
    case 'Delete':
    case 'Backspace': {
      return yield put({
        type: 'KEY_DELETE',
        ...meta,
      });
    }
    case 'ç': {
      // alt + c
      return yield put({
        type: 'ON_CONTROL_CONSOLE',
        toggle: true,
      });
    }
    case 'ƒ': {
      if (metaKey) {
        return;
      }
      // alt + f
      launchFullscreen();
      return yield put({
        type: 'SHORTCUT_FULLSCREEN',
      });
    }
    case 'µ': {
      if (metaKey) {
        return;
      }
      // alt + m
      return yield put({
        type: 'ON_MODAL_OPEN',
        id: 'MessageCenter',
      });
    }
    case 'Dead': {
      if (metaKey) {
        return;
      }
      return yield put({
        type: 'ON_MODAL_OPEN',
        id: 'ProjectCreate',
      });
    }
    case key.startsWith('Arrow') && key: {
      return yield put({
        type: 'KEY_DIRECTION',
        direction: trimLeft(key, 'Arrow').toLowerCase(),
        ...meta,
      });
    }
    default: {
      console.warn('HandleKeyPress Default Clause Reached!');
      break;
    }
  }
}

export default handleKeyPressed;
