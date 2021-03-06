import type { Patch } from "immer";

export interface User {
  /**
   * @minLength 1
   */
  publicKey: string;

  /**
   * @minLength 1
   */
  ggId: string;
}

interface Challenge {
  id: string;

  /**
   * @minimum 0
   * @maximum 5
   */
  round: number;

  timeLimit?: number;

  roundStartTime?: number;
}

export interface SharedState {
  name: string;

  currentChallenge?: Challenge;

  ownerPublicKey: string;

  /**
   * @uniqueItems true
   */
  users: User[];
}

export interface UserState {
  ready: {
    challengeId: string;
    /**
     * @minimum 1
     * @maximum 5
     */
    challengeRound: number;
  };
}

// type JSONPatch =
//   | {
//       path: string[];
//       op: "add" | "replace" | "test";
//       value: any;
//     }
//   | {
//       path: string[];
//       op: "remove";
//     }
//   | {
//       path: string[];
//       op: "move" | "copy";
//       from: string[];
//     };

/**
 * @validate
 */
export type ServerMessage =
  | {
      type: "set-state";
      payload: SharedState;
    }
  | {
      type: "state-patch";

      /**
       * @minItems 1
       */
      payload: Patch[];
    };

/**
 * @validate
 */
export type ClientMessage =
  | { type: "join"; payload: User }
  | { type: "set-user-state"; payload: UserState }
  | {
      type: "user-state-patch";
      /**
       * @minItems 1
       */
      payload: Patch[];
    };
