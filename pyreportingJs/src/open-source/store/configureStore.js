import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import reducer from './reducers';

const middleware = [
  thunkMiddleware,
];

/**
 * Initialize a Redux store with initial state, middleware, and Redux Dev Tools
 */
const configureStore = (initialState) => {
  // { serialize: true } enables ES6 types like Map() and Set() to show up in Redux Dev Tools
  const devToolsConfig = { serialize: true };
  return createStore(
    reducer,
    initialState,
    compose(
      applyMiddleware(...middleware),
      window.devToolsExtension ? window.devToolsExtension(devToolsConfig) : f => f
    )
  );
};

export default configureStore;
