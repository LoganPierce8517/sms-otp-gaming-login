import assert from "node:assert/strict";
import { LoginBody } from "./game_login.js";

const parsed = LoginBody.safeParse({ phone: "+15551234567", code: "482913" });
assert.equal(parsed.success, true);
assert.equal(LoginBody.safeParse({ phone: "123", code: "bad" }).success, false);
console.log("login boundary test passed");
