import { SignJWT } from "jose";
import test from "node:test";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
test("real login API, cookie, session history and dashboard reads (isolated only)", {skip:!base || !email || !password}, async () => {
  const target = new URL(base!);
  assert.ok(["localhost","127.0.0.1"].includes(target.hostname), "Never run test credentials against production");
  const request = (path: string, init?: RequestInit) => fetch(new URL(path,base), {redirect:"manual",...init});
  const login = (who: string, pass: string) => request("/api/auth/login", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:who,password:pass})});
  assert.equal((await request("/api/health")).status,200);
  assert.equal((await request("/api/admin/categories")).status,401);
  if (process.env.AUTH_SECRET) {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    for (const payload of [{role:"admin",exp:1},{role:"viewer",exp:Math.floor(Date.now()/1000)+60}]) {
      const bad = await new SignJWT({...payload,email:email!}).setSubject("1").setProtectedHeader({alg:"HS256"}).sign(secret);
      assert.equal((await request("/api/admin/categories",{headers:{Cookie:`kashemir_session=${bad}`}})).status,401);
    }
  }
  assert.ok([302,307].includes((await request("/admin")).status));
  assert.equal((await login("unknown@example.test",password!)).status,401);
  assert.equal((await login(email!,"wrong-password")).status,401);
  const valid = await login(email!,password!);
  assert.equal(valid.status,200);
  const cookie = valid.headers.get("set-cookie")!;
  assert.ok(cookie);
  assert.match(cookie,/HttpOnly/i);
  assert.match(cookie,/SameSite=lax/i);
  assert.match(cookie,/Max-Age=604800/i);
  if (process.env.TEST_PRODUCTION_COOKIES === "1") assert.match(cookie,/Secure/i);
  const headers = {Cookie:cookie.split(";")[0]};
  assert.equal((await request("/admin",{headers})).status,200);
  for (const path of ["categories","curtains","interiors","messages","leads","faq","gallery","statistics","settings","activity"]) {
    const response = await request(`/api/admin/${path}`,{headers});
    assert.equal(response.status,200,`dashboard/API ${path}`);
  }
  for (const path of ["/collections","/interiors","/gallery","/api/faq","/api/gallery"]) assert.equal((await request(path)).status,200,path);
  const sessions = await (await request("/api/admin/activity",{headers})).json();
  assert.ok(sessions.sessions.length >= 1);
  assert.equal((await request("/api/auth/logout",{method:"POST",headers})).status,200);
  assert.equal((await request("/api/admin/categories")).status,401);
});
