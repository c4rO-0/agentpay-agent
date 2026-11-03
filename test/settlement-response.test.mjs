import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readProviderSettlementResult} from '../src/settlement-response.mjs';
const {legacy,v2}=JSON.parse(readFileSync(new URL('../fixtures/agentpay-finalization-disclosure-v2/records.json',import.meta.resolve('@agentpay/types')),'utf8'));
test('Provider keeps receipt identity and converts only disclosed finalization instants',()=>{
 for(const finalization of [legacy,v2]){
  const result=readProviderSettlementResult({ok:true,result:{receiptId:'receipt-original',finalization}});
  assert.deepEqual(result.finalization,v2);assert.equal(result.receiptId,'receipt-original');
 }
 assert.deepEqual(readProviderSettlementResult({ok:true,result:{finalization:null}}),{finalization:null});
 for(const value of [{ok:false,result:{}},{ok:true,result:null},{ok:true,result:[]},
  {ok:true,result:{finalization:{...legacy,deliveryAcceptedAt:'2026-09-27T09:00:50'}}},
  {ok:true,result:{finalization:{...v2,releaseScheduledAtMs:'1790000000000'}}}]){
  assert.throws(()=>readProviderSettlementResult(value),{code:'SETTLEMENT_RESPONSE_INVALID'});
 }
});
test('Provider reads v1/v2 Order projection without changing identity or seconds-based chain deadlines',()=>{
 const fixture=name=>JSON.parse(readFileSync(new URL(`../fixtures/${name}/records.json`,import.meta.resolve('@agentpay/types')),'utf8'));
 const {providerOrder,buyerOrder}=fixture('agentpay-native-service-v1');
 const epoch=fixture('agentpay-participant-order-v2');
 const {legacy:deadlines,v2:deadlineV2}=fixture('agentpay-order-deadlines-v2');
 for(const order of [providerOrder,epoch.providerOrder]){
  const result=readProviderSettlementResult({ok:true,result:{...order,deadlines,finalization:legacy}});
  const {deadlines:extra,finalization,...projection}=result;
  assert.deepEqual(projection,epoch.providerOrder);assert.deepEqual(extra,deadlineV2);assert.deepEqual(finalization,v2);
 }
 for(const order of [buyerOrder,{...providerOrder,createdAt:'2026-09-27 09:00:00'},
  {...providerOrder,version:'unknown'},{...providerOrder,privateOutput:'secret'},
  {...epoch.providerOrder,providerResponseDueAtMs:null},
  {...epoch.providerOrder,createdAtMs:'1790000000000'}]){
  assert.throws(()=>readProviderSettlementResult({ok:true,result:order}),{code:'SETTLEMENT_RESPONSE_INVALID'});
 }
});
test('Provider deadline decoding also covers claim/decision replies without Order projection',()=>{
 const {legacy,v2}=JSON.parse(readFileSync(new URL('../fixtures/agentpay-order-deadlines-v2/records.json',import.meta.resolve('@agentpay/types')),'utf8'));
 for(const deadlines of [legacy,v2])assert.deepEqual(readProviderSettlementResult({ok:true,result:{claimed:true,authorizationId:'original',deadlines}}),{claimed:true,authorizationId:'original',deadlines:v2});
 for(const deadlines of [{...legacy,chainDeliveryDueAt:'2026-09-27 09:11:00'},{...v2,chainMarginMs:'60000'}])assert.throws(()=>readProviderSettlementResult({ok:true,result:{deadlines}}),{code:'SETTLEMENT_RESPONSE_INVALID'});
});
test('Provider adapts service authorization v2 separately from seconds-based Order expiry',()=>{
 const {legacy,v2}=JSON.parse(readFileSync(new URL('../fixtures/agentpay-service-authorization-v2/records.json',import.meta.resolve('@agentpay/types')),'utf8'));
 for(const result of [legacy,v2])assert.deepEqual(readProviderSettlementResult({ok:true,result},{authorizationView:true}),v2);
 for(const result of [{...legacy,expiresAt:'2026-09-27T09:05:00'},
  {...v2,expiresAtMs:'1790000000000'},{claimed:true,authorizationId:'a'}])assert.throws(()=>readProviderSettlementResult({ok:true,result},{authorizationView:true}),{code:'SETTLEMENT_RESPONSE_INVALID'});
 const missing={...legacy};delete missing.expiresAt;
 assert.throws(()=>readProviderSettlementResult({ok:true,result:missing}),{code:'SETTLEMENT_RESPONSE_INVALID'});
 assert.deepEqual(readProviderSettlementResult({ok:true,result:{authorizationId:'a',receiptId:'r'}}),{authorizationId:'a',receiptId:'r'});
});
test('Provider receipt results preserve duplicate identities and stored schedule times',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../fixtures/agentpay-delivery-result-v2/records.json',import.meta.resolve('@agentpay/types')),'utf8'));
 for(const result of [fixture.receiptLegacy,fixture.receiptV2])assert.deepEqual(readProviderSettlementResult({ok:true,result},{receiptView:true}),fixture.receiptV2);
 const duplicate={orderId:fixture.receiptLegacy.orderId,receiptId:'original',authorizationId:'original-auth',duplicate:true,billing:fixture.receiptLegacy.billing};
 const result=readProviderSettlementResult({ok:true,result:duplicate},{receiptView:true});assert.equal(result.receiptId,'original');assert.equal('releaseDueAtMs'in result,false);
 for(const result of [{...fixture.receiptLegacy,releaseDueAt:'2026-09-27T09:10:00'}, {...fixture.receiptV2,reminderDueAtMs:'1790000000000'}, {authorizationId:'a',receiptId:'r'}])assert.throws(()=>readProviderSettlementResult({ok:true,result},{receiptView:true}),{code:'SETTLEMENT_RESPONSE_INVALID'});
});
test('Provider separates and validates dispute disclosure on current and earlier Order reads',()=>{
 const {providerOrder}=JSON.parse(readFileSync(new URL('../fixtures/agentpay-participant-order-v2/records.json',import.meta.resolve('@agentpay/types')),'utf8'));
 const policy={version:'agentpay.dispute-policy.v1',submissionMs:7*86400000,evidenceMs:10*86400000,humanMs:11*86400000,decisionMs:14*86400000,releaseMs:15*86400000,refundMs:16*86400000};
 for(const disputePolicy of [null,policy])assert.deepEqual(readProviderSettlementResult({ok:true,result:{...providerOrder,disputePolicy}}).disputePolicy,disputePolicy);
 assert.throws(()=>readProviderSettlementResult({ok:true,result:{...providerOrder,disputePolicy:{...policy,decisionMs:'1209600000'}}}),{code:'SETTLEMENT_RESPONSE_INVALID'});
});
