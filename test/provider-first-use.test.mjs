import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { validateProviderDeployment, tokenAtomic, tokenDisplay } from '../src/provider-deployment.mjs';
import { portAvailable, listenerPresent } from '../src/provider-prerequisites.mjs';
const deployment = { version: 1, mode: 'production', marketUrl: 'https://market.example', settlementUrl: 'https://settlement.example',
 network: 'eip155:8453', assetAddress: `0x${'1'.repeat(40)}`, tokenDecimals: 6, tokenSymbol: 'USDC' };
test('public input rejects private keys, malformed metadata and rehearsal defaults in normal deployment', () => {
 assert.equal(validateProviderDeployment(deployment).tokenDecimals, 6);
 for(const change of [{password:'secret'}, {tokenDecimals:'6'}, {tokenSymbol:'USDC\nsecret'}, {marketUrl:'http://public.example'},
  {rehearsal:{serviceId:'random',port:6571}}, {registrationUrl:'https://password:secret@market.example'}])
  assert.throws(() => validateProviderDeployment({...deployment,...change}));
 assert.equal(validateProviderDeployment({...deployment,mode:'private-anvil',rehearsal:{serviceId:'random-guided',port:6584}}).rehearsal.port,6584);
});
test('human token amounts convert exactly with actual precision, without floating point loss', () => {
 assert.equal(tokenAtomic('0.7',6),'700000'); assert.equal(tokenAtomic('0.000001',6),'1');
 assert.equal(tokenAtomic('12345678901234567890.12',2),'1234567890123456789012');
 assert.equal(tokenDisplay('700000',6),'0.7'); assert.equal(tokenDisplay('0',6),'0');
 assert.equal(tokenDisplay('1000000',6),'1'); assert.equal(tokenAtomic('1',0),'1');
 for(const value of ['0.0000001','1e3','-1','NaN','01','1.']) assert.throws(()=>tokenAtomic(value,6));
});
test('occupied port is identified before startup, with the original listener retained', async () => {
 const server=createServer(); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)); const port=server.address().port;
 try { assert.equal(await portAvailable(port),false); assert.equal(await listenerPresent(port),true); assert.equal(server.listening,true); }
 finally {await new Promise(resolve=>server.close(resolve));}
 assert.equal(await portAvailable(port),true); assert.equal(await listenerPresent(port),false);
});
