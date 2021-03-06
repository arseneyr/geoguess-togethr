import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
  configureStore,
  createNextState,
  combineReducers,
  Middleware,
  Action,
} from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import { localStorage as persistLocalStorage } from "redux-persist-webextension-storage";
import { browser } from "webextension-polyfill-ts";

export interface SavedLobby {
  id: string;
  name?: string;
  isServer: boolean;
  identity: { publicKey: string; privateKey: string };
  tabId?: number;
}

const savedLobbyAdapter = createEntityAdapter<SavedLobby>();
const savedLobbySelector = savedLobbyAdapter.getSelectors<BackgroundRootState>(
  (state) => state.allLobbies
);
const savedLobbyLocalSelector = savedLobbyAdapter.getSelectors();

const savedLobbies = createSlice({
  name: "savedLobbies",
  initialState: savedLobbyAdapter.getInitialState(),
  reducers: {
    saveLobby: savedLobbyAdapter.addOne,
    removeSavedLobby: savedLobbyAdapter.removeOne,
    setMostRecentSavedLobby: (state, action: PayloadAction<string>) => {
      const all = savedLobbyLocalSelector.selectIds(state);
      const target = all.indexOf(action.payload);
      if (target > 0) {
        all.splice(0, 0, ...all.splice(target, 1));
      }
    },
    claimSavedLobby: (state, action: PayloadAction<string>) => {
      const existingLobby = savedLobbyLocalSelector
        .selectAll(state)
        .find((lobby) => lobby.tabId === (action as any).meta.tabId);
      if (existingLobby) {
        delete existingLobby.tabId;
      }
      savedLobbyAdapter.updateOne(state, {
        id: action.payload,
        changes: { tabId: (action as any).meta.tabId },
      });
    },
    releaseSavedLobby: (state, action: Action) => {
      const existingLobby = savedLobbyLocalSelector
        .selectAll(state)
        .find((lobby) => lobby.tabId === (action as any).meta.tabId);
      if (existingLobby) {
        delete existingLobby.tabId;
      }
    },
  },
});

const rootReducer = combineReducers({ allLobbies: savedLobbies.reducer });

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

export type BackgroundRootState = ReturnType<typeof rootReducer>;
export type BackgroundStore = ThenArg<ReturnType<typeof createStore>>;
export type BackgroundDispatch = BackgroundStore["dispatch"];

const lobbyMiddleware: Middleware<{}, BackgroundRootState> = (store) => (
  next
) => (action) => {
  if (savedLobbies.actions.claimSavedLobby.match(action)) {
    const lobby = savedLobbySelector.selectById(
      store.getState(),
      action.payload
    );
    if (lobby?.tabId) {
      if (lobby.tabId === (action as any).meta.tabId) {
        throw new Error("Double join");
      }
      browser.tabs.highlight({ tabs: lobby.tabId });
      return false;
    }
    next(action);
    return true;
  }
  return next(action);
};

function createStore() {
  const store = configureStore({
    reducer: persistReducer<BackgroundRootState>(
      {
        storage: persistLocalStorage,
        key: "ggt-lobbies",
        transforms: [
          createTransform<
            ReturnType<typeof savedLobbies["reducer"]>,
            ReturnType<typeof savedLobbies["reducer"]>
          >(
            (state) =>
              createNextState(state, (draft) => {
                savedLobbyLocalSelector
                  .selectAll(draft)
                  .forEach((e) => delete e?.tabId);
              }),
            (state) => state,
            { whitelist: ["savedLobbies"] }
          ),
        ],
      },
      rootReducer
    ),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(lobbyMiddleware),
  });
  return new Promise<typeof store>((resolve) =>
    persistStore(store, null, () => resolve(store))
  );
}

export const {
  saveLobby,
  removeSavedLobby,
  setMostRecentSavedLobby,
  claimSavedLobby,
  releaseSavedLobby,
} = savedLobbies.actions;
export { savedLobbySelector, createStore };
