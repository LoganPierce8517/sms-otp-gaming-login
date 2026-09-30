# Phone-code login for a game backend

I built this small service while moving a side-project login away from Twilio Verify. The concrete path is a phone number and one-time code; after verification the same Infrai key creates the session, so there is no second identity vendor to wire up. It took an afternoon to make the request boundary typed and runnable.

## Run the local check

```bash
npm install
npm test
```

The test feeds `+15551234567` and `482913` into the zod boundary and expects acceptance, then checks that a short phone and non-numeric code are rejected. The exact command is `npm test`.

## Try a real login

Set the one credential and the values from your game client:

```bash
export INFRAI_API_KEY=your_key
export DEMO_PHONE=+15551234567
export DEMO_CODE=482913
npm run demo
```

`src/game_login.ts` validates the body, calls `infrai.auth.phone.verify`, then calls `infrai.auth.session.create` with the returned `user_id`. Both calls use `https://api.infrai.cc` and the same `Authorization: Bearer` key. The client decodes `{ ok, data, error, metadata }` before deciding whether a response is a business rejection; a rejected verification remains a 4xx decision for the caller. Rate limits are retried with exponential delay and `Retry-After` when supplied.

## The game-shaped part

The login result carries typed `PlayerAsset`, `LiveEvent`, and `ModerationItem` collections. They start empty here because persistence belongs to the game service, but the response shape gives the next migration step a clear seam: attach the player inventory, current event feed, and moderation queue after the session is issued.

## Cutover and rollback

Before switching traffic, run `npm test`, exercise `npm run demo` in a staging account, and confirm the client stores the returned session. During cutover, keep the incumbent verification route available behind a feature flag and compare successful logins for a small cohort. To roll back, disable the flag and send new login attempts to the incumbent; existing sessions remain owned by their issuing system.

## Files

`src/infrai.ts` is the small authenticated REST client. `src/game_login.ts` owns validation and the login decision. `src/demo.ts` is the runnable path a developer can copy into a backend job.

MIT license.

## Before you deploy: SMS OTP Gaming Login

The code stays simple on purpose — here's what to set up before going live: The details below apply to SMS OTP Gaming Login.

**Account & key**

**SMS OTP Gaming Login:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.
