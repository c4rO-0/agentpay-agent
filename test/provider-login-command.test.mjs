import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

test('login command saves a private session and reuses it without another password or credential output',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'provider-login-command-'));
 const token='fixture-session-secret',password='fixture-password';let logins=0;
 const server=createServer(async(req,res)=>{
  const reply=(status,result)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify({ok:status===200,result}));};
  if(req.url==='/developers/login'){
   let raw='';for await(const chunk of req)raw+=chunk;
   const body=JSON.parse(raw);
   if(body.email!=='provider@example.invalid'||body.password!==password)return reply(401,{});
   logins++;return reply(200,{developer:{id:'fixture',email:body.email},sessionToken:token});
  }
  if(req.url==='/developers/me'&&req.headers.authorization===`Bearer ${token}`)return reply(200,{developer:{id:'fixture',email:'provider@example.invalid'}});
  reply(401,{});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const file=join(directory,'session.token');
 async function run(input){
  const child=spawn(process.execPath,[fileURLToPath(new URL('../scripts/provider-market-login.mjs',import.meta.url))],{
   env:{PATH:process.env.PATH,MARKET_BASE_URL:`http://127.0.0.1:${server.address().port}`,MARKET_EMAIL:'provider@example.invalid',MARKET_SESSION_TOKEN_FILE:file},stdio:['pipe','pipe','pipe']});
  let output='';child.stdout.on('data',c=>output+=c);child.stderr.on('data',c=>output+=c);child.stdin.end(input);
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
  assert.equal(code,0,output);assert.equal(JSON.parse(output).ok,true);
  assert.equal(output.includes(password),false);assert.equal(output.includes(token),false);
 }
 try{
  await run(password+'\n');await run('');assert.equal(logins,1);
  assert.equal((await readFile(file,'utf8')).trim(),token);assert.equal((await stat(file)).mode&0o077,0);
 }finally{await new Promise(resolve=>server.close(resolve));await rm(directory,{recursive:true,force:true});}
});
