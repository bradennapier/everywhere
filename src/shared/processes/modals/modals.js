import { Process } from 'redux-saga-process';
import Immutable from 'seamless-immutable';
import { call, put, select } from 'redux-saga/effects';

import { createSelector } from 'reselect';

import _ from 'lodash';

const buildConfig = config => ({
  reduces: 'modals',
  pid: 'modals',
  exports: ['actions', 'selectors'],
  log: false,
  ...config,
});

// const processLoadsOnAction = 'AUTH_SESSION';

const processInitialState = Immutable.from({
  isOpened: false,
  id: undefined,
  modalProps: {},
  prompt: undefined,
});

const processActionCreators = {
  onModalOpen: ['id', 'modalProps'],
  onModalClose: ['force'],
  onPromptOpen: [{ type: 'ON_MODAL_OPEN', id: 'Prompt' }, 'modalProps'],
  onPromptClose: [{ type: 'ON_MODAL_CLOSE', id: 'Prompt' }, 'force'],
};

const processActionRoutes = {
  onModalOpen: 'handleOpenModal',
  onModalClose: 'handleCloseModal',
  keyEscape: 'handleCloseModal',
};

const processReducer = {
  modalCloses: state =>
    Immutable.merge(state, {
      id: undefined,
    }),
  modalOpens: (state, action) =>
    Immutable.merge(state, {
      id: action.id,
      modalProps: action.modalProps || state.modalProps || {},
    }),
  promptOpens: (state, action) =>
    Immutable.merge(state, {
      prompt: {
        isOpened: true,
        id: 'Prompt',
        modalProps: action.modalProps,
      },
    }),
  promptCloses: state =>
    Immutable.merge(state, {
      prompt: undefined,
    }),
};

export default function configureModalsProcess(_config) {
  const config = buildConfig(_config);

  const processSelectors = {};

  const stateKeySelector = state => state[config.reduces];

  processSelectors.modalIsOpen = createSelector(
    stateKeySelector,
    modal => modal.isOpened,
  );

  processSelectors.modal = createSelector(stateKeySelector, modal => ({
    isOpened: modal.isOpened,
    id: modal.id,
    modalProps: modal.modalProps,
  }));

  processSelectors.prompt = createSelector(stateKeySelector, modal => ({
    isOpened: modal.prompt && modal.prompt.isOpened,
    id: modal.prompt && modal.prompt.id,
    modalProps: modal.prompt && modal.prompt.modalProps,
  }));

  const processConfig = {
    pid: config.pid,
    reduces: config.reduces,
  };

  class ModalsProcess extends Process {
    * handleOpenModal({ id, modalProps, toggle }) {
      if (id === 'Prompt') {
        yield put({
          type: 'PROMPT_OPENS',
          id,
          modalProps,
        });
      } else {
        const modal = yield select(stateKeySelector);

        if (modal.id === id && toggle === true) {
          return yield call([this, this.handleCloseModal], {}, modal);
        }
        yield put({
          type: 'MODAL_OPENS',
          id,
          modalProps,
        });
      }
    }

    * handleCloseModal({ force, id }, _modal) {
      // If we try to open a modal which is already opened it will instead
      // be closed
      if (id === 'Prompt') {
        yield put({
          type: 'PROMPT_CLOSES',
        });
      } else {
        const modal = _modal || (yield select(stateKeySelector));
        if (id && modal && modal.id !== id) {
          return null;
        }
        if (
          force !== true &&
          _.get(modal, 'modalProps.isCloseable') === false
        ) {
          console.info('Tried to close a modal which is not allowed to close!');
        } else if (_.get(modal, 'id') !== undefined) {
          yield put({
            type: 'MODAL_CLOSES',
          });
        }
      }
    }
  }

  return {
    process: ModalsProcess,
    config: processConfig,
    initialState: processInitialState,
    actionCreators: processActionCreators,
    actionRoutes: processActionRoutes,
    selectors: processSelectors,
    reducer: processReducer,
  };
}
