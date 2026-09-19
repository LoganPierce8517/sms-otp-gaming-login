import { verifyGameLogin } from "./game_login.js";

const phone = process.env.DEMO_PHONE;
const code = process.env.DEMO_CODE;
if (!phone || !code) throw new Error("Set DEMO_PHONE and DEMO_CODE");
const result = await verifyGameLogin({ phone, code });
console.log(JSON.stringify(result, null, 2));
