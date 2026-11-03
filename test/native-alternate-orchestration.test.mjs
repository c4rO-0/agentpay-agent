import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import mysql from 'mysql2/promise';
import {hashPrivateRequest} from '@agentpay/types';
import {createNativeProviderRuntime} from '../src/native-provider-runtime.mjs';

const b32=value=>'0x'+value.repeat(64);
const now=()=>Date.now();
function memoryDatabase(){
 const rows=new Map(),locks=new Set(),queries=[];
 const connection={
  async query(sql,args=[]){
   queries.push(sql);
   if(sql.includes('GET_LOCK')){if(locks.has(args[0]))return [[{acquired:0}]];locks.add(args[0]);return [[{acquired:1}]];}
   if(sql.includes('RELEASE_LOCK')){locks.delete(args[0]);return [[{released:1}]];}
   if(sql.startsWith('SELECT * FROM agentpay_provider_executions'))return [[structuredClone(rows.get(args[0]))].filter(Boolean)];
   if(sql.startsWith('INSERT INTO agentpay_provider_executions')){
    if(!rows.has(args[0]))rows.set(args[0],{order_id:args[0],request_hash:args[1],request_json:args[2],claim_id:args[3],receipt_id:args[4],state:'received',
     authorization_id:null,max_usage_units:null,output_json:null,output_hash:null,usage_units:null,
     created_at_ms:args[7],updated_at_ms:args[8],completed_at_ms:null,created_at:args[5],updated_at:args[6],completed_at:null});
    return [{affectedRows:1}];
   }
   const row=rows.get(args.at(-1));assert(row,'an Order row must exist before update');
   if(sql.includes('SET authorization_id=?')){if(row.state==='received'){row.authorization_id=args[0];row.max_usage_units=args[1];row.updated_at_ms=args[3];}}
   else if(sql.includes("SET state='accepted'")){if(['received','accepted'].includes(row.state)){row.state='accepted';row.authorization_id=args[0];row.updated_at_ms=args[2];}}
   else if(sql.includes("SET state='executing'")){if(row.state==='accepted'){row.state='executing';row.updated_at_ms=args[1];}}
   else if(sql.includes("SET state='completed'")){if(row.state==='executing'){row.state='completed';row.output_json=args[0];row.output_hash=args[1];row.usage_units=args[2];row.completed_at_ms=args[5];row.updated_at_ms=args[5];}}
   else if(sql.includes("SET state='receipt_submitted'")){row.state='receipt_submitted';row.updated_at_ms=args[1];}
   else throw Error('Unexpected SQL: '+sql);
   return [{affectedRows:1}];
  },release(){},destroy(){}
 };
 return {rows,queries,locks,pool:{query:async()=>[[],[]],getConnection:async()=>connection,end:async()=>{}}};
}
// Old environment settings must never terminate a normal service process.
for (const retiredCrashPoint of ['claimed','accepted','completed','receipt_accepted'])
test(`alternate business recovery ignores retired crash setting: ${retiredCrashPoint}`,async t=>{
 const dir=await mkdtemp(join(tmpdir(),'alternate-provider-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const credential=join(dir,'credential');await writeFile(credential,'fixture-credential',{mode:0o600});
 const env={AGENTPAY_NATIVE_PROVIDER_CRASH_AFTER:retiredCrashPoint,AGENTPAY_NATIVE_PROVIDER_ENABLED:'true',AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE:'admitted',AGENT_PROVIDER_CREDENTIAL_FILE:credential,
  AGENT_PROVIDER_DB_USER:'fixture',AGENT_PROVIDER_DB_NAME:'fixture',AGENT_NATIVE_ASSET:'0x'+'2'.repeat(40),
  AGENT_NATIVE_SKILL_ID:b32('3'),AGENT_NATIVE_PROFILE_HASH:b32('4'),AGENT_NATIVE_SELLER:'0x'+'1'.repeat(40),
  AGENT_NATIVE_OFFER_ID:b32('5'),AGENT_NATIVE_QUOTE_TTL_SECONDS:'600'};
 const before={...process.env};Object.assign(process.env,env);delete process.env.AGENT_NATIVE_VALID_UNTIL;
 t.after(()=>{for(const key of [...Object.keys(env),'AGENT_NATIVE_VALID_UNTIL'])before[key]===undefined?delete process.env[key]:process.env[key]=before[key];});
 const db=memoryDatabase();t.mock.method(mysql,'createPool',()=>db.pool);
 const actions=[],receipts=[];let loseFirstReceipt=true;
 t.mock.method(globalThis,'fetch',async (url,options)=>{
  const action=String(url).split('/').at(-1),body=JSON.parse(options.body);actions.push(action);
  const orderId=body.orderId,requestHash=body.requestHash||db.rows.get(orderId)?.request_hash;
  if(action==='receipt'){
   receipts.push(body);
   if(loseFirstReceipt){loseFirstReceipt=false;throw Error('reply lost after accepted receipt');}
   return Response.json({ok:true,result:{version:'agentpay.delivery-result.v2',orderId,duplicate:false,receiptId:body.receiptId,
    billing:{usageUnits:body.usageUnits,finalChargeAtomic:'2',sellerAmountAtomic:'2',feeAmountAtomic:'0',buyerReturnAmountAtomic:'0'},
    deliveryJobId:'job-1',reminderDueAtMs:now()+1000,releaseDueAtMs:now()+2000}});
  }
  const result={version:'agentpay.service-authorization.v2',authorizationId:'auth-1',orderId,providerId:'provider:test',
   skillId:env.AGENT_NATIVE_SKILL_ID,profileHash:env.AGENT_NATIVE_PROFILE_HASH,requestHash,maxUsageUnits:'3',
   state:action==='claim'?'claimed':'accepted',expiresAtMs:now()+60000};
  return Response.json({ok:true,result});
 });
 let executeCount=0,recoverCount=0;
 const application={validate(request){assert.equal(typeof request.text,'string');},
  async execute({request,orderId}){executeCount++;if(request.text==='interrupted')throw Error('external work interrupted');
   return {output:{answer:{text:request.text,orderId},confidence:0.75},usageUnits:'2'};},
  async recover({orderId}){recoverCount++;return {output:{answer:{text:'reconciled',orderId},confidence:0.75},usageUnits:'2'};}};
 const runtime=await createNativeProviderRuntime({serviceId:'text',settlementBaseUrl:'https://settlement.example',publicBaseUrl:'https://provider.example',application});t.after(()=>runtime.close());
 async function invoke(orderId,text){const request={text};let status,payload;
  await runtime.handle({method:'POST',headers:{authorization:'AgentPay valid'}},{},new URL('https://provider.example/services/text/agentpay/invoke'),{
   readJson:async()=>({version:'agentpay.service-invocation.v1',orderId,requestHash:hashPrivateRequest(request),request}),
   json(_res,code,value){status=code;payload=value;}});
  return {status,payload};}
 const first=await invoke(b32('6'),'hello');assert.equal(first.status,502);
 assert.equal(db.rows.get(b32('6')).state,'completed',JSON.stringify(first.payload));assert.equal(db.rows.get(b32('6')).usage_units,'2');
 assert.equal(db.rows.get(b32('6')).output_hash,'0x'+createHash('sha256').update(db.rows.get(b32('6')).output_json).digest('hex'));
 const resumed=await invoke(b32('6'),'hello');assert.equal(resumed.status,200);assert.equal(resumed.payload.result.output.answer.text,'hello');
 assert.equal(executeCount,1);assert.equal(receipts[0].receiptId,receipts[1].receiptId);
 const interrupted=await invoke(b32('7'),'interrupted');assert.equal(interrupted.status,502);assert.equal(db.rows.get(b32('7')).state,'executing');
 const reconciled=await invoke(b32('7'),'interrupted');assert.equal(reconciled.status,200);
 assert.equal(reconciled.payload.result.output.answer.text,'reconciled');assert.equal(recoverCount,1);
 assert.equal(db.rows.get(b32('7')).usage_units,'2');assert.equal(db.rows.get(b32('7')).state,'receipt_submitted');
 assert.equal(db.locks.size,0);assert(actions.includes('claim')&&actions.includes('decision')&&actions.includes('receipt'));
});
