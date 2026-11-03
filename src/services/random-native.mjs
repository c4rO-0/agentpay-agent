import {randomInt} from 'node:crypto';
// Application-owned behavior. AgentPay orchestration does not interpret min/max.
export const randomNativeApplication=Object.freeze({
 validate(request){
  if(!request||Object.keys(request).sort().join(',')!=='max,min'||!Number.isSafeInteger(request.min)||!Number.isSafeInteger(request.max)||request.min<0||request.max>1e9||request.min>request.max)throw Object.assign(Error('Use integer bounds: 0 <= min <= max <= 1000000000'),{code:'INVALID_INPUT'});
 },
 async execute({request}){return {output:{kind:'random',value:randomInt(request.min,request.max+1)},usageUnits:'1'};},
 // Generation has no external side effect. A crash before durable completion may
 // regenerate; after completion the saved result is authoritative.
 async recover(context){return this.execute(context);}
});
