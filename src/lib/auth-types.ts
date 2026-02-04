export type AuthState = "unauthenticated" | "member" | "admin";

export interface SessionData {
  state: AuthState;
  ownerid?: number;
}
