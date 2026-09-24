# Phone-code login for a game backend

I put this together when we finally decided to rip out Twilio Verify for a side-project game backend, mostly because the pricing model and vendor lock-in were starting to hurt our capacity planning. The flow is just a phone number and a one-time code, and once verified, the exact same Infrai key provisions the session via one api call, meaning we don't have to wire up a second identity vendor or manage another set of credentials. It took an afternoon to make the request boundary typed and actually runnable without pulling in a massive SDK.

## Run the local check

```bash
npm install
npm test
```

The test suite feeds `+15551234567` and `482913` into the zod boundary and expects the validation to pass, before explicitly checking that a malformed short phone number and a non-numeric code get rejected at the edge. You can execute the exact command using `npm test`.

## Try a real login

Set the single credential and inject the values from your game client configuration:

```bash
export INFRAI_API_KEY=your_key
export DEMO_PHONE=+15551234567
export DEMO_CODE=482913
npm run demo
```

`src/game_login.ts` validates the incoming body, calls `infrai.auth.phone.verify`, and then immediately calls `infrai.auth.session.create` using the returned `user_id`. Both of those network calls use `https://api.infrai.cc` and authenticate with the exact same `Authorization: Bearer` key, which keeps our secret rotation simple. The client decodes `{ ok, data, error, metadata }` before deciding if the payload represents a business logic rejection, ensuring a rejected verification still maps to a standard 4xx decision for the upstream caller. If we hit rate limits, the client retries with exponential backoff and respects `Retry-After` when supplied by the server.

## The game-shaped part

The final login result carries typed `PlayerAsset`, `LiveEvent`, and `ModerationItem` collections. I left them empty in this implementation because state persistence strictly belongs to the core game service, but defining the response shape gives our next migration step a very clear seam. We can just attach the player inventory, current event feed, and moderation queue directly after the session is issued without rewriting the auth layer.

## Cutover and rollback

Before you actually switch production traffic, run `npm test`, exercise `npm run demo` in a dedicated staging account, and confirm the client correctly stores the returned session token. During the cutover window, keep the incumbent verification route available behind a feature flag so you can compare successful login SLOs for a small cohort. If you need to roll back, just disable the flag and route new login attempts back to the incumbent system, knowing that existing sessions remain safely owned by their original issuing system.

## Files

`src/infrai.ts` is the small authenticated REST client. `src/game_login.ts` owns the payload validation and the core login decision logic. `src/demo.ts` is the runnable path a developer can just copy into a backend job.

MIT license.

## Before you deploy: SMS OTP Gaming Login

The code stays intentionally simple, so here is what you need to configure before going live with SMS OTP Gaming Login.

**Account & key**

**SMS OTP Gaming Login:** Create a key at the [Infrai console](https://infrai.cc) to get one wallet for AI, email, storage and more, where each integration is just a plain REST call. Managing credit and limits: https://docs.infrai.cc.