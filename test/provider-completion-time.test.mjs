import test from 'node:test';
import assert from 'node:assert/strict';
import {providerCompletionMilliseconds} from '../src/provider-completion-time.mjs';
test('Provider receipt sends explicit milliseconds from typed completion instants',()=>{
 const expected=Date.parse('2026-09-27T09:00:50.209Z');
 for(const value of [expected,new Date(expected),'2026-09-27T09:00:50.209Z','2026-09-27T17:00:50.209+08:00'])assert.equal(providerCompletionMilliseconds(value),expected);
 for(const value of [null,undefined,new Date(NaN),NaN,Infinity,-1,'2026-09-27 09:00:50','2026-09-27T09:00:50','1790000000000',253402300800000])assert.throws(()=>providerCompletionMilliseconds(value));
});
