import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, chmod, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { hashServiceProfile } from '@agentpay/types';
import { createProviderOnboarding, runProviderGuide, localReady } from '../src/provider-onboarding.mjs';
import { checkProviderConnectionConfig } from '../src/provider-connection-config.mjs';
import { encodeConfig, savePrivate } from '../src/provider-private-files.mjs';
import { saveProviderBinding } from '../src/provider-binding-state.mjs';
import { createMarketSession } from '../src/provider-market-session.mjs';
import { createProviderBindingRuntime } from '../src/provider-binding-runtime.mjs';
const ok = result => new Response(JSON.stringify({ ok: true, result }));
async function fixture({ admitted = true, registeredInitially = true, pending = false, expired = false, qualified = true, fresh = true, restricted = false, qualificationCheck = null } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'provider-connection-')), path = join(dir, 'connection.env');
  const env = { MARKET_BASE_URL: 'https://market.example', SETTLEMENT_BASE_URL: 'https://settlement.example', MARKET_EMAIL: 'provider@example.com',
    MARKET_SESSION_TOKEN_FILE: join(dir, 'session'), AGENT_PROD_SERVICE_ID: 'random', AGENT_MCP_ENDPOINT: 'https://provider.example/services/random/mcp/invoke',
    AGENT_PROVIDER_CONTROL_URL: 'http://127.0.0.1:6584', AGENT_PROVIDER_BINDING_STATE_FILE: join(dir, 'binding'),
    AGENT_PROVIDER_BINDING_CREDENTIAL_FILE: join(dir, 'credential'), AGENT_NATIVE_NETWORK: 'eip155:31337', AGENT_NATIVE_ASSET: `0x${'1'.repeat(40)}` };
  const profile = { version: 'agentpay.service-profile.v1', providerId: 'provider:market:account', serviceId: 'random', mcpEndpoint: env.AGENT_MCP_ENDPOINT,
    paymentEndpoint: 'https://provider.example/services/random/agentpay/invoke', seller: `0x${'2'.repeat(40)}`, network: env.AGENT_NATIVE_NETWORK, asset: env.AGENT_NATIVE_ASSET };
  const skillId = `0x${'3'.repeat(64)}`, profileHash = hashServiceProfile(profile);
  const binding = { providerId: profile.providerId, credentialId: 'cred', status: pending ? 'pending' : 'verified', endpointUrl: env.AGENT_MCP_ENDPOINT.replace(/\/invoke$/, '') };
  await writeFile(path, encodeConfig(env), { mode: 0o600 });
  await writeFile(env.MARKET_SESSION_TOKEN_FILE, 'SESSION_SECRET', { mode: 0o600 });
  await writeFile(env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE, 'CREDENTIAL_SECRET', { mode: 0o600 });
  if (!pending) await saveProviderBinding(env.AGENT_PROVIDER_BINDING_STATE_FILE, binding);
  let registered = registeredInitially, unavailable = false, mismatch = false, failRegister = false;
  let failIssue = false; const writes = []; let currentToken = 'CREDENTIAL_SECRET'; let expiry = expired ? Date.now() - 1000 : Date.now() + 60000;
  const fetchImpl = async (input, init = {}) => {
    const url = new URL(input);
    if (unavailable) throw new Error('offline');
    if (url.pathname === '/developers/me') return ok({ developer: { id: 'account', email: env.MARKET_EMAIL } });
    if (url.pathname === '/developers/me/provider-binding') return ok({ binding, credential: { credentialId: binding.credentialId, credentialStatus: pending ? 'pending_verification' : 'active', expiresAtMs: expiry } });
    if (url.pathname.endsWith('/provider-binding/issue')) { writes.push('reissue'); if (failIssue) throw new Error('response lost'); binding.credentialId = 'new-cred'; currentToken = 'NEW_CREDENTIAL_SECRET'; expiry = Date.now() + 60000; return ok({binding,credential:currentToken,challenge:{challengeId:'new-challenge'}}); }
    if (url.pathname.endsWith('/credentials/me') && (expiry <= Date.now() || init.headers.authorization !== `Bearer ${currentToken}`)) return new Response(JSON.stringify({error:{code:'UNAUTHORIZED'}}),{status:401});
    if (url.pathname.endsWith('/credentials/me')) return ok({ ...binding, credentialStatus: pending ? 'pending_verification' : 'active' });
    if (url.pathname === '/internal/agentpay/provider-binding/status') return pending ? new Response('{}', {status:401}) : ok({ endpointPath: '/services/random/mcp', credentialLoaded: true, paidCredentialMatches: admitted,
      nativeProvider: { enabled: true, admissionState: admitted ? 'admitted' : 'pre_admission', skillId, profileHash } });
    if (url.pathname === '/health') return ok({ serviceId: 'random', nativeProvider: { enabled: true, route: '/services/random/agentpay/invoke', admissionState: admitted ? 'admitted' : 'pre_admission' } });
    if (url.pathname.endsWith('/agentpay/invoke')) return new Response(JSON.stringify({ version: 'agentpay.service-payment-required.v1', resource: {url:profile.paymentEndpoint, method:'POST'},
      requirement: { skillId, profileHash: mismatch ? `0x${'4'.repeat(64)}` : profileHash, seller:profile.seller, network:profile.network, asset:profile.asset } }), {status:402});
    if (url.pathname.endsWith('/services/read')) return ok({ registered, qualificationCheck, profile: registered ? profile : null, serviceStatus: {qualification:{qualificationStatus:qualified?'qualified':'not_qualified'},quote:{quoteStatus:fresh?'fresh':'missing'}} });
    if (url.pathname.endsWith('/purchase-readiness')) return ok({ commercialReady:registered&&qualified&&fresh&&!restricted, blockers:restricted?['PROVIDER_RESTRICTED']:qualified?[]:['REGISTRY_QUALIFICATION_INVALID'], quote:registered ? {providerId:profile.providerId,skillId,profileHash}:null });
    if (url.pathname.endsWith('/services/register')) { writes.push('register'); if(failRegister) throw new Error('registration down'); registered=true; return ok({skillId,profileHash,...profile}); }
    throw new Error(`Unexpected request: ${url.pathname}`);
  };
  const ops = await createProviderOnboarding(path, {fetchImpl});
  return {ops,env,path,writes,fetchImpl, failIssue(){failIssue=true;}, retryIssue(){failIssue=false;}, mismatch(){mismatch=true;}, offline(){unavailable=true;}, failRegistration(){failRegister=true;}, recover(){failRegister=false;}, cleanup:()=>rm(dir,{recursive:true,force:true})};
}
const screen = answers => ({text:[], heading(s){this.text.push(s);},write(s){this.text.push(s);},async ask(){assert.ok(answers.length,'unexpected extra question');return answers.shift();}});
test('connection config rejects database, prices and process-management settings', async()=>{
  const f=await fixture();try{for(const [key,value] of [['AGENT_PROVIDER_DB_NAME','provider'],['AGENT_PROD_PORT','6584'],['AGENT_NATIVE_BASE_AMOUNT','0']])
    assert.throws(()=>checkProviderConnectionConfig({...f.env,[key]:value}),/Not an AgentPay connection setting/);
  }finally{await f.cleanup();}
});
test('already connected service completes without config changes or setup writes',async()=>{
  const f=await fixture();try{const before=await readFile(f.path,'utf8');const ui=screen([]);await runProviderGuide(f.ops,ui);
    assert.match(ui.text.join('\n'),/Connection complete/);assert.doesNotMatch(ui.text.join('\n'),/SESSION_SECRET|CREDENTIAL_SECRET/);
    assert.match(ui.text.join('\n'),/Service: random/);
    assert.match(ui.text.join('\n'),/Market account: valid · provider@example.com \(saved session\)/);
    assert.equal(await readFile(f.path,'utf8'),before);assert.deepEqual(f.writes,[]);
  }finally{await f.cleanup();}
});
test('registration uses live provider declaration and preserves binding on failed retry',async()=>{
  const f=await fixture({registeredInitially:false});try{f.failRegistration();await runProviderGuide(f.ops,screen(['continue','q']));
    assert.equal((await f.ops.inspect()).binding.ready,true);f.recover();await runProviderGuide(f.ops,screen(['continue']));
    assert.equal((await f.ops.inspect()).complete,true);assert.deepEqual(f.writes,['register','register']);
  }finally{await f.cleanup();}
});
test('qualified platform and local pre-admission are reported independently; no local mutation',async()=>{
  const f=await fixture({admitted:false});try{const ui=screen(['q']);await runProviderGuide(f.ops,ui);
    assert.match(ui.text.join('\n'),/Registry qualification is confirmed, but Provider local paid admission is not ready/);
    assert.equal((await f.ops.inspect()).platformComplete,true);assert.equal((await f.ops.inspect()).complete,false);assert.deepEqual(f.writes,[]);
  }finally{await f.cleanup();}
});
test('canonical declaration mismatch and unavailable APIs do not trigger registration',async()=>{
  const f=await fixture({registeredInitially:false});try{f.mismatch();const state=await f.ops.inspect();assert.match(state.serviceError,/canonical/);
    await runProviderGuide(f.ops,screen(['continue','q']));assert.deepEqual(f.writes,[]);
    f.offline();await runProviderGuide(f.ops,screen(['continue','q']));assert.deepEqual(f.writes,[]);
  }finally{await f.cleanup();}
});
test('pending binding tells administrator to load credential instead of starting a server',async()=>{
  const f=await fixture({pending:true});try{const ui=screen(['q']);await assert.rejects(f.ops.bind(ui),/credential loading is pending/);
    assert.match(ui.text.join('\n'),/does not install or restart/);assert.deepEqual(f.writes,[]);
  }finally{await f.cleanup();}
});
test('an admitted flag alone does not prove paid runtime readiness',()=>{
  assert.equal(localReady({registration:{registered:true},readiness:{commercialReady:true}}, {nativeProvider:{admissionState:'admitted'}}),false);
});
test('session refresh preserves valid sessions, rejects unknown state/wrong account, and rejects symlinks', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'provider-session-'));
  const env = { MARKET_BASE_URL: 'https://market.example', MARKET_EMAIL: 'provider@example.com', MARKET_SESSION_TOKEN_FILE: join(dir, 'token') };
  let expired = false, unavailable = false, wrong = false, logins = 0;
  const client = createMarketSession({ env, fetchImpl: async (url, options) => {
    if (unavailable) throw new Error('offline');
    if (new URL(url).pathname.endsWith('/login')) { logins++; expired = false; return ok({ developer: { id: 'account', email: env.MARKET_EMAIL }, sessionToken: 'new-token' }); }
    if (expired) return new Response('{}', { status: 401 });
    return ok({ developer: { id: 'account', email: wrong ? 'other@example.com' : env.MARKET_EMAIL } });
  } });
  try {
    await writeFile(env.MARKET_SESSION_TOKEN_FILE, 'old-token', { mode: 0o600 });
    await client.login('unused'); assert.equal(logins, 0);
    expired = true; await client.login('password'); assert.equal(logins, 1);
    unavailable = true; await assert.rejects(client.login('password'), /offline/); assert.equal(logins, 1);
    unavailable = false; wrong = true; await assert.rejects(client.inspect(), /different account/);
    await chmod(env.MARKET_SESSION_TOKEN_FILE, 0o644); await assert.rejects(client.inspect(), /0600/);
    await chmod(env.MARKET_SESSION_TOKEN_FILE, 0o600);
    const alias = join(dir, 'alias'); await symlink(env.MARKET_SESSION_TOKEN_FILE, alias);
    await assert.rejects(savePrivate(alias, 'overwrite'), /0600/);
    assert.equal(await readFile(env.MARKET_SESSION_TOKEN_FILE, 'utf8'), 'new-token\n');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('authenticated runtime status proves loaded credential without exposing token or authorizing challenges', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'provider-runtime-status-'));
  try {
    const credentialFile = join(dir, 'token'); await writeFile(credentialFile, 'secret-token', { mode: 0o600 });
    let remoteWrites = 0;
    const runtime = await createProviderBindingRuntime({ endpointPath: '/services/random/mcp', settlementBaseUrl: 'https://settlement.example', credentialFile,
      inspectPaidRuntime: token => ({ paidCredentialMatches: token === 'secret-token' }), fetchImpl: async () => { remoteWrites++; throw new Error('must not call'); } });
    let reply;
    const helpers = { json: (_res, status, body) => { reply = { status, body }; }, readJson: async () => { throw new Error('must not read body'); } };
    const res = { setHeader() {} }, url = new URL('http://127.0.0.1/internal/agentpay/provider-binding/status');
    await runtime.handle({ method: 'GET', headers: {} }, res, url, helpers); assert.equal(reply.status, 401);
    await runtime.handle({ method: 'GET', headers: { authorization: 'Bearer secret-token' } }, res, url, helpers);
    assert.equal(reply.status, 200); assert.equal(reply.body.result.paidCredentialMatches, true);
    assert.doesNotMatch(JSON.stringify(reply.body), /secret-token/); assert.equal(remoteWrites, 0);
  } finally { await rm(dir, { recursive: true, force: true }); }
});


test('expired pending credential offers explicit reissue; cancellation preserves all files',async()=>{
  const f=await fixture({pending:true,expired:true});try{
    const before=await readFile(f.path,'utf8'); const ui=screen(['continue','reissue','q','q']);
    await runProviderGuide(f.ops,ui);
    assert.match(ui.text.join('\n'),/Pending credential expired/);
    assert.match(ui.text.join('\n'),/\* 'reissue'/);
    assert.doesNotMatch(ui.text.join('\n'),/\* 'continue'/);
    assert.equal(await readFile(f.path,'utf8'),before);assert.deepEqual(f.writes,[]);
  }finally{await f.cleanup();}
});
test('explicit reissue uses a fresh file and persists its path for restarting the guide',async()=>{
  const f=await fixture({pending:true,expired:true});try{
    await f.ops.reissue(screen(['confirm']));
    const env=f.ops.env();assert.notEqual(env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE,f.env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE);
    assert.equal(await readFile(f.env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE,'utf8'),'CREDENTIAL_SECRET');
    assert.equal((await readFile(env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE,'utf8')).trim(),'NEW_CREDENTIAL_SECRET');
    const resumed=await createProviderOnboarding(f.path,{fetchImpl:f.fetchImpl});
    assert.equal((await f.ops.inspect()).nextStep,'verify_endpoint');
    assert.equal(resumed.env().AGENT_PROVIDER_BINDING_CREDENTIAL_FILE,env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE);
    assert.deepEqual(f.writes,['reissue']);
  }finally{await f.cleanup();}
});

test('failed reissue leaves a persisted recovery destination and can explicitly retry',async()=>{
 const f=await fixture({pending:true,expired:true});try{
  f.failIssue();await assert.rejects(f.ops.reissue(screen(['confirm'])),/response lost/);
  const resumed=await createProviderOnboarding(f.path,{fetchImpl:f.fetchImpl});
  assert.equal((await resumed.inspect()).nextStep,'reissue');
  assert.equal(await readFile(f.env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE,'utf8'),'CREDENTIAL_SECRET');
  f.retryIssue();await resumed.reissue(screen(['confirm']));
  assert.equal((await resumed.inspect()).nextStep,'verify_endpoint');
 }finally{await f.cleanup();}
});

test('pending Registry qualification uses read-only checks, never bind or re-register',async()=>{
 const f=await fixture({qualified:false});try{
  let binds=0,clients=0;const ops={...f.ops,bind:async()=>{binds++;},serviceClient:async()=>{clients++;throw new Error('unexpected registration');}};
  const ui=screen(['continue','check','q']);await runProviderGuide(ops,ui);
  assert.match(ui.text.join('\n'),/Waiting for Registry qualification/);assert.match(ui.text.join('\n'),/status checks do not write Registry/i);
  assert.doesNotMatch(ui.text.join('\n'),/\* 'continue'|Endpoint control verified|Paid service registered/);
  assert.equal(binds,0);assert.equal(clients,0);assert.deepEqual(f.writes,[]);
 }finally{await f.cleanup();}
});
test('passing qualification checks wait for automatic registration without manual owner instructions or writes',async()=>{
 const f=await fixture({qualified:false,qualificationCheck:{action:'ready_to_register',blockers:[]}});try{
  const ui=screen(['check','q']);await runProviderGuide(f.ops,ui);
  const text=ui.text.join('\n');
  assert.match(text,/Settlement will register your service automatically/);
  assert.match(text,/Wait about a minute, then enter 'check'/);
  assert.doesNotMatch(text,/operator-controlled|Ask .* to register|\* 'continue'/);
  assert.deepEqual(f.writes,[]);
 }finally{await f.cleanup();}
});
test('held qualification keeps its reason and does not promise automatic completion',async()=>{
 const f=await fixture({qualified:false,qualificationCheck:{action:'hold',blockers:['registry_identity_conflict']}});try{
  const ui=screen(['q']);await runProviderGuide(f.ops,ui);const text=ui.text.join('\n');
  assert.match(text,/Registry contains a different service identity/);
  assert.match(text,/investigate the conflict/);
  assert.doesNotMatch(text,/will register your service automatically/);
  assert.deepEqual(f.writes,[]);
 }finally{await f.cleanup();}
});
test('verified declaration mismatch offers configure handoff and does not attempt registration',async()=>{
 const f=await fixture({registeredInitially:false});try{
  f.mismatch();const ui=screen(['configure','ready','q']);await runProviderGuide(f.ops,ui);
  assert.match(ui.text.join('\n'),/Update your service declaration/);assert.match(ui.text.join('\n'),/\* 'configure'/);
  assert.match(ui.text.join('\n'),/application tools/);assert.doesNotMatch(ui.text.join('\n'),/\* 'continue'/);assert.deepEqual(f.writes,[]);
 }finally{await f.cleanup();}
});
test('qualified local pre-admission offers application loading, without repeating platform writes',async()=>{
 const f=await fixture({admitted:false});try{
  const ui=screen(['configure','q','q']);await runProviderGuide(f.ops,ui);
  assert.match(ui.text.join('\n'),/Prepare local paid admission/);assert.match(ui.text.join('\n'),/\* 'configure'/);
  assert.match(ui.text.join('\n'),/Application loading is pending/);assert.deepEqual(f.writes,[]);
 }finally{await f.cleanup();}
});
test('qualified service with missing Quote offers status check, without re-registration',async()=>{
 const f=await fixture({fresh:false});try{
  const ui=screen(['check','q']);await runProviderGuide(f.ops,ui);
  assert.match(ui.text.join('\n'),/Waiting for service readiness/);assert.match(ui.text.join('\n'),/\* 'check'/);
  assert.match(ui.text.join('\n'),/default: about once a minute/);
  assert.match(ui.text.join('\n'),/Wait about a minute, then enter 'check'/);
  assert.match(ui.text.join('\n'),/If blockers remain after a few minutes/);
  assert.doesNotMatch(ui.text.join('\n'),/Waiting for platform review|\* 'continue'/);assert.deepEqual(f.writes,[]);
 }finally{await f.cleanup();}
});

test('platform restriction explains new-Order suspension without asking to re-register',async()=>{
 const f=await fixture({restricted:true});try{const ui=screen(['q']);await runProviderGuide(f.ops,ui);assert.match(ui.text.join('\n'),/Service suspended/);assert.match(ui.text.join('\n'),/Existing Orders continue/);assert.doesNotMatch(ui.text.join('\n'),/Waiting for service readiness|Wait about a minute/);assert.deepEqual(f.writes,[]);}finally{await f.cleanup();}
});
