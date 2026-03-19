import type { Hono } from "hono";
import type { ServicePlugin, Store, WebhookDispatcher, TokenMap, AppEnv, RouteContext } from "@internal/core";
import { getGoogleStore } from "./store.js";
import { generateUid } from "./helpers.js";
import { oauthRoutes } from "./routes/oauth.js";

export { getGoogleStore, type GoogleStore } from "./store.js";
export * from "./entities.js";

export interface GoogleSeedConfig {
  port?: number;
  users?: Array<{
    email: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    locale?: string;
  }>;
  oauth_clients?: Array<{
    client_id: string;
    client_secret: string;
    name: string;
    redirect_uris: string[];
  }>;
}

function seedDefaults(store: Store, _baseUrl: string): void {
  const gs = getGoogleStore(store);

  gs.users.insert({
    uid: generateUid("goog"),
    email: "testuser@gmail.com",
    name: "Test User",
    given_name: "Test",
    family_name: "User",
    picture: null,
    email_verified: true,
    locale: "en",
  });
}

export function seedFromConfig(store: Store, _baseUrl: string, config: GoogleSeedConfig): void {
  const gs = getGoogleStore(store);

  if (config.users) {
    for (const u of config.users) {
      const existing = gs.users.findOneBy("email", u.email);
      if (existing) continue;

      const nameParts = (u.name ?? "").split(/\s+/);
      gs.users.insert({
        uid: generateUid("goog"),
        email: u.email,
        name: u.name ?? u.email.split("@")[0],
        given_name: u.given_name ?? nameParts[0] ?? "",
        family_name: u.family_name ?? nameParts.slice(1).join(" ") ?? "",
        picture: u.picture ?? null,
        email_verified: true,
        locale: u.locale ?? "en",
      });
    }
  }

  if (config.oauth_clients) {
    for (const client of config.oauth_clients) {
      const existing = gs.oauthClients.findOneBy("client_id", client.client_id);
      if (existing) continue;
      gs.oauthClients.insert({
        client_id: client.client_id,
        client_secret: client.client_secret,
        name: client.name,
        redirect_uris: client.redirect_uris,
      });
    }
  }
}

export const googlePlugin: ServicePlugin = {
  name: "google",
  register(app: Hono<AppEnv>, store: Store, webhooks: WebhookDispatcher, baseUrl: string, tokenMap?: TokenMap): void {
    const ctx: RouteContext = { app, store, webhooks, baseUrl, tokenMap };
    oauthRoutes(ctx);
  },
  seed(store: Store, baseUrl: string): void {
    seedDefaults(store, baseUrl);
  },
};

export default googlePlugin;
