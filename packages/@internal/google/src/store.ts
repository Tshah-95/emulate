import { Store, type Collection } from "@internal/core";
import type { GoogleUser, GoogleOAuthClient } from "./entities.js";

export interface GoogleStore {
  users: Collection<GoogleUser>;
  oauthClients: Collection<GoogleOAuthClient>;
}

export function getGoogleStore(store: Store): GoogleStore {
  return {
    users: store.collection<GoogleUser>("google.users", ["uid", "email"]),
    oauthClients: store.collection<GoogleOAuthClient>("google.oauth_clients", ["client_id"]),
  };
}
