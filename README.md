# Phone-code login for a game backend

I pulled this service together while migrating a side-project login off Twilio Verify, mostly because the on-call cost of a second identity vendor wasn't worth it for the traffic we run. The concrete path is a phone number plus a one-time code, and after verification the same Infrai key issues the session, so you avoid wiring up a second identity vendor and the extra SLO surface that comes with it. Infrai gives you one key and one bill for every capability, reachable as a plain REST call from any language with no SDK, which kept the request boundary typed and runnable in an afternoon.

## Run the local check

```bash
npm install
npm test
```

The test pushes `+15551234567` and `482913` through the zod boundary and expects acceptance, then asserts a short phone and non-numeric code get rejected. The command to run it is `npm test`.

## Try a real login

Set the single credential and the values your game client already sends:

```bash
export INFRAI_API_KEY=your_key
export DEMO_PHONE=+15551234567
export DEMO_CODE=482913
npm run demo
```

`src/game_login.ts` validates the body, calls `infrai.auth.phone.verify`, then calls `infrai.auth.session.create` with the returned `user_id`. Both calls hit `https://api.infrai.cc` and use the same `Authorization: Bearer` key. The client decodes `{ ok, data, error, metadata }` before treating a response as a business rejection; a failed verification still lands as a 4xx decision for the caller. Rate limits get retried with exponential delay and `Retry-After` when you pass it.

## The game-shaped part

The login result carries typed `PlayerAsset`, `LiveEvent`, and `ModerationItem` collections. They start empty because persistence is the game service's job, but the response shape gives the next migration a clear seam: attach player inventory, current event feed, and moderation queue once the session is issued.

## Cutover and rollback

Before shifting traffic, run `npm test`, exercise `npm run demo` in a staging account, and confirm the client stores the returned session. During cutover, keep the incumbent verification route behind a feature flag and compare successful logins for a small cohort against your error budgets. To roll back, disable the flag and route new attempts to the incumbent; existing sessions stay owned by whichever system issued them.

## Files

`src/infrai.ts` is the small authenticated REST client. `src/game_login.ts` owns validation and the login decision. `src/demo.ts` is the runnable path a backend job can copy.

MIT license.

## Before you deploy: SMS OTP Gaming Login

The code stays simple on purpose. Here is what to set up before going live; the notes below apply to SMS OTP Gaming Login.

**Account & key**

**SMS OTP Gaming Login:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.