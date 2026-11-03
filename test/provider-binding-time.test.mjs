import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createProviderBindingRuntime} from '../src/provider-binding-runtime.mjs';
const id=`provider_challenge_${'a'.repeat(32)}`;
const at=1_791_000_000_123;
async function fixture(result,fn) {
  const dir=await mkdtemp(join(tmpdir(),'agentpay-binding-time-'));
  try {
    const credentialFile=join(dir,'credential');await writeFile(credentialFile,'test-only\n',{mode:0o600});
    let clock=at;
    const runtime=await createProviderBindingRuntime({credentialFile,endpointPath:'/mcp',settlementBaseUrl:'http://127.0.0.1:6572',
      now:()=>clock,fetchImpl:async()=>new Response(JSON.stringify({ok:true,result:{challengeResponse:'answer',
        challengeUrl:`https://provider.example/mcp/.well-known/agentpay/provider-binding/${id}`,...result}}))});
    const invoke=async(method,path)=>{
      let payload,status,text;
      const res={writeHead(value){status=value;},end(value){text=value;}};
      await runtime.handle({method,headers:{authorization:'Bearer test-only'}},res,new URL(path,'http://127.0.0.1'),
        {readJson:async()=>({challengeId:id}),json(_res,code,body){status=code;payload=body;}});
      return {payload,status,text};
    };
    await fn(invoke,value=>{clock=value;});
  }finally{await rm(dir,{recursive:true,force:true});}
}
test('Provider holds integer expiry and stops exposing response at the exact millisecond',async()=>{
  await fixture({expiresAtMs:at+1,expiresAt:new Date(at+1).toISOString()},async(invoke,clock)=>{
    const authorized=await invoke('POST','/internal/agentpay/provider-binding/authorize');
    assert.equal(authorized.status,200);assert.equal(authorized.payload.result.expiresAtMs,at+1);
    assert.equal((await invoke('GET',`/mcp/.well-known/agentpay/provider-binding/${id}`)).text,'answer');
    clock(at+1);assert.equal((await invoke('GET',`/mcp/.well-known/agentpay/provider-binding/${id}`)).status,404);
  });
});
test('strict legacy binding adapter accepts explicit offset, rejects unknown time and conflicting clocks',async()=>{
  for(const result of [{expiresAt:new Date(at+1000).toISOString()},
    {expiresAt:'2026-10-07 08:00:00'},{expiresAtMs:null,expiresAt:new Date(at+1000).toISOString()},
    {expiresAtMs:at,expiresAt:new Date(at).toISOString()},
    {expiresAtMs:at+1,expiresAt:new Date(at+2).toISOString()}]) {
    await fixture(result,async invoke=>{
      const authorized=await invoke('POST','/internal/agentpay/provider-binding/authorize');
      const valid=!Object.hasOwn(result,'expiresAtMs') && result.expiresAt.includes('T');
      assert.equal(authorized.status,valid?200:502);
      if(!valid)assert.equal((await invoke('GET',`/mcp/.well-known/agentpay/provider-binding/${id}`)).status,404);
    });
  }
});
