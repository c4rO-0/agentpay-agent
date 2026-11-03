import {assertUnixMilliseconds} from '@agentpay/types';
export function executionTimeMs(row,field,{nullable=false}={}) {
 const value=row[field+'_ms'];
 if(value==null){if(nullable&&row[field]==null)return null;throw Object.assign(Error(`Provider timestamp migration required: ${field}_ms`),{code:'TIMESTAMP_MIGRATION_REQUIRED'});}
 const ms=typeof value==='string'&&/^(0|[1-9][0-9]*)$/.test(value)?Number(value):value;
 try{return assertUnixMilliseconds(ms);}catch{throw Object.assign(Error(`Invalid Provider timestamp: ${field}_ms`),{code:'TIMESTAMP_STORAGE_INVALID'});}
}
export function executionTimeRow(row) {
 if(!row)return row;
 const result={...row};
 for(const field of ['created_at','updated_at','completed_at']){
  const nullable=field==='completed_at'&&!['completed','receipt_submitted'].includes(row.state);
  const ms=executionTimeMs(row,field,{nullable});
  result[field+'_ms']=ms;result[field]=ms==null?null:new Date(ms).toISOString();
 }
 return result;
}
export const executionClock=()=>assertUnixMilliseconds(Date.now());
export const executionCalendar=ms=>new Date(assertUnixMilliseconds(ms)).toISOString().slice(0,23).replace('T',' ');
