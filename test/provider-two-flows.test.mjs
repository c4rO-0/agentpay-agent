import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {encodeConfig} from '../src/provider-private-files.mjs';
import {createProviderInstallation} from '../src/provider-installation.mjs';
import {createProviderOnboarding,runProviderGuide} from '../src/provider-onboarding.mjs';
const ok=result=>new Response(JSON.stringify({ok:true,result}));
test('two independent coordinators complete credential loading, B1 profile refresh, B2 and qualified admission with retry reuse',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'provider-two-flows-')),installationPath=join(dir,'installation.env'),connectionPath=join(dir,'connection.env');
 const connection={MARKET_BASE_URL:'https://market.example',SETTLEMENT_BASE_URL:'https://settlement.example',MARKET_EMAIL:'provider@example.com',
 MARKET_SESSION_TOKEN_FILE:join(dir,'session'),AGENT_PROD_SERVICE_ID:'random',AGENT_MCP_ENDPOINT:'https://provider.example/services/random/mcp/invoke',AGENT_PROVIDER_CONTROL_URL:'http://127.0.0.1:6584',
 AGENT_PROVIDER_BINDING_STATE_FILE:join(dir,'binding'),AGENT_PROVIDER_BINDING_CREDENTIAL_FILE:join(dir,'credential'),AGENT_NATIVE_NETWORK:'eip155:31337',AGENT_NATIVE_ASSET:`0x${'1'.repeat(40)}`};
 const deployment={version:1,mode:'private-anvil',marketUrl:connection.MARKET_BASE_URL,settlementUrl:connection.SETTLEMENT_BASE_URL,network:connection.AGENT_NATIVE_NETWORK,assetAddress:connection.AGENT_NATIVE_ASSET,
 tokenDecimals:6,tokenSymbol:'rUSDC',rehearsal:{serviceId:'random',port:6584,payoutAddress:`0x${'2'.repeat(40)}`}};
 await writeFile(join(dir,'storage.env'),encodeConfig({AGENT_PROVIDER_DB_HOST:'127.0.0.1',AGENT_PROVIDER_DB_PORT:'3306',AGENT_PROVIDER_DB_NAME:'own_execution',AGENT_PROVIDER_DB_USER:'own_user',AGENT_PROVIDER_DB_PASSWORD:'DB_SECRET'}),{mode:0o600});
 await writeFile(installationPath,encodeConfig({SERVICE_ID:'random',PORT:'6584'}),{mode:0o600});await writeFile(connectionPath,encodeConfig(connection),{mode:0o600});
 await writeFile(`${connectionPath}.deployment.json`,JSON.stringify(deployment),{mode:0o600});await writeFile(`${connectionPath}.reference.json`,JSON.stringify({version:1,installationPath}),{mode:0o600});
 let binding=null,live=null,registered=null,qualified=false,applicationRuns=0,issue=0,verify=0,register=0,dbChecks=0;
 const fetchImpl=async(input,init={})=>{
  const url=new URL(input);
  if(url.pathname==='/developers/login')return ok({developer:{id:'account',email:connection.MARKET_EMAIL},sessionToken:'SESSION_SECRET'});
  if(url.pathname==='/developers/me')return ok({developer:{id:'account',email:connection.MARKET_EMAIL}});
  if(url.pathname==='/developers/me/provider-binding'&&init.method!=='POST')return ok({binding,credential:binding?{credentialId:'cred',credentialStatus:binding.status==='verified'?'active':'pending_verification'}:null});
  if(url.pathname.endsWith('/provider-binding/issue')){issue++;binding={providerId:'provider:market:account',credentialId:'cred',status:'pending',endpointUrl:'https://provider.example/services/random/mcp'};return ok({binding,credential:'CONTROL_SECRET',challenge:{challengeId:`provider_challenge_${'a'.repeat(32)}`}});}
  if(url.pathname.endsWith('/credentials/me'))return ok({...binding,credentialStatus:binding.status==='verified'?'active':'pending_verification'});
  if(url.pathname==='/developers/me/provider-binding'&&init.method==='POST')return ok({binding,challenge:{challengeId:`provider_challenge_${'a'.repeat(32)}`}});
  if(url.pathname==='/internal/agentpay/provider-binding/authorize'){assert.ok(live);return ok({challengeId:JSON.parse(init.body).challengeId,responseHeldByProvider:true});}
  if(url.pathname.endsWith('/provider-binding/verify')){verify++;binding.status='verified';return ok({binding});}
  if(url.pathname==='/internal/agentpay/provider-binding/status')return live?ok({endpointPath:'/services/random/mcp',credentialLoaded:true,paidCredentialMatches:live.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE==='admitted',nativeProvider:{enabled:true,admissionState:live.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE,skillId:live.AGENT_NATIVE_SKILL_ID,profileHash:live.AGENT_NATIVE_PROFILE_HASH}}):new Response('{}',{status:401});
  if(url.pathname==='/health')return live?ok({serviceId:'random',nativeProvider:{enabled:true,route:'/services/random/agentpay/invoke',skillId:live.AGENT_NATIVE_SKILL_ID,profileHash:live.AGENT_NATIVE_PROFILE_HASH,admissionState:live.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE}}):new Response('{}',{status:503});
  if(url.pathname.endsWith('/agentpay/invoke'))return new Response(JSON.stringify({version:'agentpay.service-payment-required.v1',resource:{url:'https://provider.example/services/random/agentpay/invoke',method:'POST'},
   requirement:{skillId:live.AGENT_NATIVE_SKILL_ID,profileHash:live.AGENT_NATIVE_PROFILE_HASH,seller:live.AGENT_NATIVE_SELLER,network:live.AGENT_NATIVE_NETWORK,asset:live.AGENT_NATIVE_ASSET}}),{status:402});
  if(url.pathname.endsWith('/services/read'))return ok({registered:!!registered,profile:registered?.profile,serviceStatus:{qualification:{qualificationStatus:qualified?'qualified':'not_qualified'},quote:{quoteStatus:'fresh'}}});
  if(url.pathname==='/agentpay/purchase-readiness')return ok({commercialReady:!!registered&&qualified,blockers:qualified?[]:['REGISTRY_NOT_QUALIFIED'],quote:registered?{providerId:binding.providerId,skillId:registered.skillId,profileHash:registered.profileHash}:null});
  if(url.pathname.endsWith('/services/register')){register++;registered=JSON.parse(init.body);return ok({...registered,providerId:binding.providerId,serviceId:'random',paymentEndpoint:registered.profile.paymentEndpoint});}
  throw new Error(`unexpected ${url.pathname}`);
 };
 const manager={logFile:join(dir,'process.log'),async ensure(env,{ready}){live={...env};assert.equal(await ready(),true);}};
 const application=await createProviderInstallation(installationPath,{fetchImpl,manager,databaseCheck:async()=>{dbChecks++;return{ok:true};}});
 const account=await createProviderOnboarding(connectionPath,{fetchImpl});
 const output=[];
 const appUi={heading(s){output.push(s);},write(s){output.push(s);},async ask(){assert.ok(appAnswers.length);return appAnswers.shift();}};
 let appAnswers=['','0.6','0.1'];
 async function loadApplication(){await application.configure(connectionPath,appUi);applicationRuns++;}
 let prompts=0;
 const ui={heading(s){output.push(s);},write(s){output.push(s);},async ask(prompt){
  if(++prompts>12)throw new Error('flow did not finish: '+output.slice(-8).join('\n'));
  if(prompt==='Market password')return 'PASSWORD_SECRET';
  if(prompt.startsWith("Type 'ready'")){await loadApplication();return 'ready';}
  if(prompt.startsWith("Run the application command")){await loadApplication();return 'ready';}
  if(prompt.startsWith("Enter 'configure'"))return 'configure';
  if(prompt.startsWith("Enter 'check'")){qualified=true;return 'check';}
  if(prompt.startsWith("Enter 'continue'"))return 'continue';
  throw new Error(`unexpected prompt ${prompt}`);
 }};
 try{
  await runProviderGuide(account,ui);
  assert.equal(applicationRuns,3);assert.equal(issue,1);assert.equal(verify,1);assert.equal(register,1);assert.equal(dbChecks,3);
  assert.equal((await account.inspect()).complete,true);assert.match(output.join('\n'),/Connection complete/);assert.match(output.join('\n'),/Update your service declaration/);assert.match(output.join('\n'),/Waiting for Registry qualification/);assert.match(output.join('\n'),/Prepare local paid admission/);assert.match(output.join('\n'),/provider-install.mjs .* configure /);
  assert.doesNotMatch(output.join('\n'),/SESSION_SECRET|CONTROL_SECRET|PASSWORD_SECRET|DB_SECRET/);
  const state=await readFile(join(dir,'service.json'),'utf8');await runProviderGuide(account,{heading(){},write(){},async ask(){throw new Error('completed flow asked another question');}});
  assert.equal(issue,1);assert.equal(register,1);assert.equal(await readFile(join(dir,'service.json'),'utf8'),state);
 }finally{await rm(dir,{recursive:true,force:true});}
});
