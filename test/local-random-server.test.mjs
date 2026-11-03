import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalRandomServer} from '../src/local-random-server.mjs';
test('generation helper has no paid routes and cannot assert installation storage readiness',async()=>{
  const server=createLocalRandomServer({serviceId:'local-test'});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    assert.deepEqual(await (await fetch(`${base}/health`)).json(),{ok:true,serviceId:'local-test',mode:'local-installation',storageReady:false});
    const result=await (await fetch(`${base}/random`,{method:'POST'})).json();
    assert.equal(result.ok,true);assert.ok(Number.isInteger(result.randomNumber));assert.ok(result.randomNumber>=0&&result.randomNumber<1e9);
    assert.equal((await fetch(`${base}/services/local-test/agentpay/invoke`,{method:'POST'})).status,404);
    assert.equal((await fetch(`${base}/random`)).status,404);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
