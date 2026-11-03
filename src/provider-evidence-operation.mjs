import {createHash} from 'node:crypto';
// Content-addressed operations survive a lost response or process restart without
// another local recovery file. Identical evidence for the same Order is a retry;
// edited evidence is a new submission. Object key ordering is not a new submission.
function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
 return value;
}
export function providerEvidenceOperationId(orderId,evidence){
 return '0x'+createHash('sha256').update(JSON.stringify(['agentpay.provider-evidence.v1',orderId,canonical(evidence)])).digest('hex');
}
