import {hashServiceOutput} from '@agentpay/types';
export async function executeApplication(application,context,{recovering=false,maxUsageUnits}={}){
 const operation=recovering?application.recover:application.execute;
 if(typeof operation!=='function')throw Object.assign(Error('Application must reconcile the interrupted execution before retrying'),{code:'APPLICATION_RECOVERY_REQUIRED'});
 const result=await operation.call(application,context);
 if(!result||typeof result.usageUnits!=='string'||!/^(0|[1-9][0-9]{0,76})$/.test(result.usageUnits)||BigInt(result.usageUnits)>BigInt(maxUsageUnits))throw Object.assign(Error('Application usage exceeds the authorized maximum'),{code:'APPLICATION_USAGE_INVALID'});
 // Preserve the application's JSON shape and property order.
 return {...result,outputHash:hashServiceOutput(result.output)};
}
