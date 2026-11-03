import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {connectionCommand,assertInstallationConnection} from '../src/provider-reference-handoff.mjs';
import {encodeConfig} from '../src/provider-private-files.mjs';
import {createProviderOnboarding} from '../src/provider-onboarding.mjs';

test('install handoff uses a distinct connection directory for each installation and quotes paths',()=>{
 const first=connectionCommand('/private/first/installation.env');
 const second=connectionCommand('/private/second instance/installation.env');
 assert.match(first,/--new '\/private\/first\/connection'/);
 assert.match(second,/--new '\/private\/second instance\/connection'/);
 assert.doesNotMatch(second,/provider\/connection/);
 assert.ok(connectionCommand("/private/owner's service/installation.env").includes("owner'\\''s service"));
});

test('connection reuse requires the same installation path, service and port',()=>{
 const args={installationPath:'/private/first/installation.env',installation:{SERVICE_ID:'first',PORT:'6585'},
  reference:{version:1,installationPath:'/private/first/installation.env'},
  connection:{AGENT_PROD_SERVICE_ID:'first',AGENT_PROVIDER_CONTROL_URL:'http://127.0.0.1:6585'}};
 assert.doesNotThrow(()=>assertInstallationConnection(args));
 assert.throws(()=>assertInstallationConnection({...args,installationPath:'/private/second/installation.env'}),/different installation/);
 assert.throws(()=>assertInstallationConnection({...args,installation:{SERVICE_ID:'second',PORT:'6585'}}),/different installation/);
 assert.throws(()=>assertInstallationConnection({...args,installation:{SERVICE_ID:'first',PORT:'6586'}}),/different installation/);
 assert.throws(()=>assertInstallationConnection({...args,reference:null}),/no matching installation reference/);
});

test('CLI rejects another installation/platform before login and preserves existing connection material',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'provider-reuse-'));
 try{
  const oldPath=join(dir,'installation.env'),otherPath=join(dir,'other.env'),path=join(dir,'connection.env');
  const env={MARKET_BASE_URL:'https://market.example',SETTLEMENT_BASE_URL:'https://settlement.example',MARKET_EMAIL:'provider@example.com',
   MARKET_SESSION_TOKEN_FILE:join(dir,'session'),AGENT_PROD_SERVICE_ID:'first',AGENT_MCP_ENDPOINT:'https://provider.example/services/first/mcp/invoke',
   AGENT_PROVIDER_CONTROL_URL:'http://127.0.0.1:6585',AGENT_PROVIDER_BINDING_STATE_FILE:join(dir,'binding'),AGENT_PROVIDER_BINDING_CREDENTIAL_FILE:join(dir,'credential'),
   AGENT_NATIVE_NETWORK:'eip155:31337',AGENT_NATIVE_ASSET:`0x${'1'.repeat(40)}`};
  await writeFile(oldPath,encodeConfig({SERVICE_ID:'first',PORT:'6585'}),{mode:0o600});
  await writeFile(otherPath,encodeConfig({SERVICE_ID:'second',PORT:'6586'}),{mode:0o600});
  await writeFile(path,encodeConfig(env),{mode:0o600});
  await writeFile(`${path}.reference.json`,JSON.stringify({version:1,installationPath:oldPath}),{mode:0o600});
  await writeFile(env.MARKET_SESSION_TOKEN_FILE,'SESSION_SECRET',{mode:0o600});
  await writeFile(env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE,'CREDENTIAL_SECRET',{mode:0o600});
  const tracked=[path,`${path}.reference.json`,env.MARKET_SESSION_TOKEN_FILE,env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE];
  const before=await Promise.all(tracked.map(p=>readFile(p,'utf8')));
  const script=fileURLToPath(new URL('../scripts/provider-setup.mjs',import.meta.url));
  const cli=args=>spawnSync(process.execPath,[script,...args],{encoding:'utf8',timeout:10000});
  const wrong=cli(['--new',dir,'--installation',otherPath]);
  assert.equal(wrong.status,1,wrong.stderr);assert.match(wrong.stdout,/different installation/,wrong.stderr);
  assert.doesNotMatch(wrong.stdout,/Market password|SESSION_SECRET|CREDENTIAL_SECRET/);
  const config=join(dir,'public.json');
  await writeFile(config,JSON.stringify({version:1,mode:'private-anvil',marketUrl:'https://different.example',settlementUrl:env.SETTLEMENT_BASE_URL,
   network:env.AGENT_NATIVE_NETWORK,assetAddress:env.AGENT_NATIVE_ASSET,tokenDecimals:6,tokenSymbol:'rUSDC'}),{mode:0o600});
  const platform=cli(['--new',dir,'--installation',oldPath,'--deployment',config]);
  assert.equal(platform.status,1);assert.match(platform.stdout,/different platform/);
  assert.deepEqual(await Promise.all(tracked.map(p=>readFile(p,'utf8'))),before);
  const resumed=await createProviderOnboarding(path,{fetchImpl:async()=>new Response('{}',{status:401})});
  assert.equal((await resumed.inspect()).nextStep,'sign_in');
  await writeFile(`${path}.reference.json`,JSON.stringify({version:1,installationPath:otherPath}),{mode:0o600});
  let network=0;
  await assert.rejects(createProviderOnboarding(path,{fetchImpl:async()=>{network++;throw Error('unexpected request');}}),/different installation/);
  assert.equal(network,0);
 }finally{await rm(dir,{recursive:true,force:true});}
});
