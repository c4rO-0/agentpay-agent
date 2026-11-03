#!/usr/bin/env node
import {homedir} from 'node:os';
import {join} from 'node:path';
import {loadProviderConnectionConfig} from '../src/provider-connection-config.mjs';
import {readFile} from 'node:fs/promises';
import {providerEvidenceOperationId} from '../src/provider-evidence-operation.mjs';
import {readPrivateFile} from '../src/provider-binding-client.mjs';
import {serviceUrl} from '../src/service-url.mjs';
// Uses the same Provider environment/credential as the reference connection tool.
// There is no platform SQL or filesystem access.
try{
 const args=process.argv.slice(2);let connectionPath=join(homedir(),'.local/share/agentpay/provider/connection/connection.env');
 if(args[0]==='--connection'){args.shift();connectionPath=args.shift();if(!connectionPath)throw Error('Supply your saved connection.env path');}
 const [first,second,file]=args;const orderId=first==='list'?undefined:first,action=first==='list'?'list':second;
 if(action!=='list'&&!/^0x[0-9a-f]{64}$/.test(orderId||'')||!['list','access','read','evidence'].includes(action)||action==='evidence'&&!file)throw Error('Usage: node scripts/provider-case.mjs [--connection PATH] list | ORDER_ID access|read|evidence [evidence.json]');
 const connection=await loadProviderConnectionConfig(connectionPath);
 const base=connection.SETTLEMENT_BASE_URL,credentialFile=connection.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE;
 if(!base||!credentialFile)throw Error('Choose your saved connection file with --connection PATH.');
 const token=await readPrivateFile(credentialFile,'Provider credential');
 let body={orderId};if(action==='evidence'){
  const text=await readFile(file,'utf8');if(text.length>3*1048576)throw Error('Evidence file is too large');
  const evidence=JSON.parse(text);
  body={...body,operationId:providerEvidenceOperationId(orderId,evidence),evidence};
 }
 const response=await fetch(serviceUrl(base,'/agentpay/provider/disputes/'+action),{method:'POST',redirect:'error',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)}),result=await response.json();
 if(!response.ok||!result.ok)throw Error(result.error?.message||'Case request failed');
 if(action==='access')console.log('Open Market → Account → Order support. Paste this one-hour, one-Order code. Keep it private.\n\n'+result.result.token);
 else console.log(JSON.stringify(result.result,null,2));
}catch(e){console.error(String(e.message||e));process.exitCode=1;}
