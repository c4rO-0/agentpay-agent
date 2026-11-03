import {serviceUrl} from './service-url.mjs';
export function createProviderCaseMonitor({base,credential,fetchImpl=fetch,notify=console.warn}){
 let timer=null,active=null,stopped=false,cursor=null;const seen=new Map();
 async function check(){if(stopped||active)return;active=(async()=>{
  for(let page=0;page<10&&!stopped;page++){
  const response=await fetchImpl(serviceUrl(base,'/agentpay/provider/disputes/list'),{method:'POST',redirect:'error',signal:AbortSignal.timeout(5000),headers:{authorization:'Bearer '+credential,'content-type':'application/json'},body:JSON.stringify({limit:100,...(cursor?{afterOrderId:cursor}:{})})});
  if(!response.ok)throw Error('Provider case inbox unavailable');const body=await response.json();if(body.ok!==true||!Array.isArray(body.result))throw Error('Invalid Provider case inbox');
  for(const row of body.result){if(!/^0x[0-9a-f]{64}$/.test(row.order_id||''))continue;const version=String(row.revision)+':'+row.case_state;if(seen.get(row.order_id)===version)continue;seen.set(row.order_id,version);notify(`[agentpay] Delivery case ${row.order_id}: ${row.case_state}. Evidence deadline: ${row.schedule?.evidenceAtMs}. Use the Provider case tool; do not execute the service again.`);}
  cursor=body.result.length===100?body.result.at(-1).order_id:null;
  if(body.result.length<100)break;
  }
  while(seen.size>1000)seen.delete(seen.keys().next().value);
 })();try{await active;}catch{notify('[agentpay] Could not check delivery cases. Automatic retry will continue.');}finally{active=null;}}
 return {start(){stopped=false;if(timer)return;void check();timer=setInterval(()=>void check(),60000);timer.unref();},async stop(){stopped=true;clearInterval(timer);timer=null;await active;},check};
}
