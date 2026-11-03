import { parseEnv } from 'node:util';
import mysql from 'mysql2/promise';
import { privateText, savePrivate, encodeConfig } from './provider-private-files.mjs';
import { ensureSchema } from './native-provider-runtime.mjs';
const keys = ['AGENT_PROVIDER_DB_HOST','AGENT_PROVIDER_DB_PORT','AGENT_PROVIDER_DB_NAME','AGENT_PROVIDER_DB_USER','AGENT_PROVIDER_DB_PASSWORD'];
export function checkStorage(input) {
  if (Object.keys(input).some(key => !keys.includes(key)) || keys.slice(0,4).some(key => typeof input[key] !== 'string' || !input[key].trim()) ||
      typeof input.AGENT_PROVIDER_DB_PASSWORD !== 'string' || !/^\d+$/.test(input.AGENT_PROVIDER_DB_PORT) || Number(input.AGENT_PROVIDER_DB_PORT)<1 || Number(input.AGENT_PROVIDER_DB_PORT)>65535)
    throw new Error('Invalid application storage configuration');
  return {...input};
}
export async function loadStorage(path) {
  const text = await privateText(path, true);
  if (text === null) throw new Error('Application installation is incomplete: execution storage is missing. Run the installation guide first; AgentPay connection does not prepare storage.');
  return checkStorage(parseEnv(text));
}
export async function openStorage(env) {
  const pool = mysql.createPool({host:env.AGENT_PROVIDER_DB_HOST,port:Number(env.AGENT_PROVIDER_DB_PORT),user:env.AGENT_PROVIDER_DB_USER,
    password:env.AGENT_PROVIDER_DB_PASSWORD,database:env.AGENT_PROVIDER_DB_NAME,connectionLimit:4,connectTimeout:5000});
  try { await ensureSchema(pool); return pool; }
  catch(error){await pool.end().catch(()=>{});throw new Error(`Application storage initialization failed (${error.code || 'SQL_ERROR'}). Check your own database and schema privileges; see doc/runbooks/provider-database.md.`);}
}
export async function prepareStorage(path, ui, { initialize = openStorage } = {}) {
  const prior = await privateText(path,true);
  let env;
  if(prior!==null) env=await loadStorage(path);
  else {
    const draftPath=`${path}.draft.json`,text=await privateText(draftPath,true),draft=text===null?{}:JSON.parse(text);
    if(Object.entries(draft).some(([key,value])=>!keys.slice(0,4).includes(key)||typeof value!=='string'))throw new Error('Invalid installation storage draft');
    ui.heading('Prepare application execution storage');
    ui.write('The reference service uses its own MySQL for durable execution and retries. Prepare it here before installation can finish.\nUse an existing database and dedicated login from your own administrator.\nSee doc/runbooks/provider-database.md in the Agent repository for provisioning commands.');
    env={...draft};
    for(const [key,label,fallback] of [[keys[0],'Your MySQL host','127.0.0.1'],[keys[1],'Your MySQL port','3306'],[keys[2],'Your existing execution database name',''],[keys[3],'Your database login','']]) {
      if(env[key] && (key!==keys[1] || /^\d+$/.test(env[key])&&Number(env[key])>=1&&Number(env[key])<=65535))continue;
      while(true){
        const value=(await ui.ask(`${label}${fallback?` (Enter uses '${fallback}')`:''}; 'q' returns`))||fallback;
        if(value==='q')throw new Error('Installation paused; non-secret storage answers are saved');
        if(!value||/[\r\n\0]/.test(value)||(key===keys[1]&&(!/^\d+$/.test(value)||Number(value)<1||Number(value)>65535))){ui.write('Enter the requested value.');continue;}
        env[key]=value;await savePrivate(draftPath,JSON.stringify(env)+'\n');break;
      }
    }
    ui.write('Database password is hidden and stored only in this private application configuration.');
    env[keys[4]]=await ui.ask('Database password (Enter accepts an empty password)',{secret:true});checkStorage(env);
  }
  const pool=await initialize(env);await pool.end();
  if(prior===null)await savePrivate(path,encodeConfig(env),{create:true});
  const {rm}=await import('node:fs/promises');await rm(`${path}.draft.json`,{force:true});
  ui.write('Application execution schema is ready.');return env;
}
