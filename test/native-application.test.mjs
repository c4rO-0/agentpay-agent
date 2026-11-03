import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {executeApplication} from '../src/native-application.mjs';
import {randomNativeApplication} from '../src/services/random-native.mjs';
import {prepareServiceRun} from '../src/service-runtime.mjs';
test('application owns payload and metering; orchestration preserves output bytes',async()=>{
 const context={orderId:'order-1',requestHash:'digest',request:{text:'hello'}};
 const application={execute:async input=>{assert.equal(input.orderId,'order-1');return {output:{z:input.request.text,a:{v:3}},usageUnits:'2'};}};
 const result=await executeApplication(application,context,{maxUsageUnits:'3'});
 assert.deepEqual(result.output,{z:'hello',a:{v:3}});
 assert.equal(result.outputHash,'0x'+createHash('sha256').update(JSON.stringify(result.output)).digest('hex'));
 await assert.rejects(executeApplication(application,context,{maxUsageUnits:'1'}),{code:'APPLICATION_USAGE_INVALID'});
 await assert.rejects(executeApplication(application,context,{maxUsageUnits:'3',recovering:true}),{code:'APPLICATION_RECOVERY_REQUIRED'});
});
test('interrupted application explicitly reconciles using original order identity',async()=>{
 const calls=[],application={execute:async()=>{throw Error('must not repeat')},recover:async context=>{calls.push(context.orderId);return {output:['saved','result'],usageUnits:'0'};}};
 assert.deepEqual((await executeApplication(application,{orderId:'original'},{recovering:true,maxUsageUnits:'1'})).output,['saved','result']);assert.deepEqual(calls,['original']);
});
test('random validation and one-unit usage stay inside the example application',async()=>{
 assert.throws(()=>randomNativeApplication.validate({min:4,max:3}));
 const context={request:{min:4,max:4}};randomNativeApplication.validate(context.request);
 assert.equal((await executeApplication(randomNativeApplication,context,{maxUsageUnits:'1'})).output.value,4);
 assert.throws(()=>prepareServiceRun('typo',{}),{code:'UNKNOWN_SERVICE_KIND'});
});
