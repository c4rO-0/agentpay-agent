// Business-neutral read-only retrieval. No execution or billing callback exists.
export async function retrieveOriginalResult({permission,skillId,profileHash,verify,read}){
 const checked=await verify(permission);
 if(checked.skillId!==skillId||checked.profileHash!==profileHash)throw fail('RETRIEVAL_FORBIDDEN','Permission belongs to another service');
 const row=await read(checked.orderId);
 if(!row||!['completed','receipt_submitted'].includes(row.state)||row.order_id!==checked.orderId||row.request_hash!==checked.requestHash||checked.outputHash&&row.output_hash!==checked.outputHash)throw fail('ORIGINAL_RESULT_UNAVAILABLE','Original result is unavailable. Submit delivery evidence separately.');
 return row;
}
function fail(code,message){return Object.assign(Error(message),{code});}
