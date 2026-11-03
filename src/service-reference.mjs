import {normalizeServiceReference} from '@agentpay/types';
// Public registered identity, independent of application business and package.
export function serviceReference({skillId,profileHash,profile}){
 return normalizeServiceReference({version:'agentpay.service-reference.v1',skillId,profileHash,profile,adapter:'agentpay.json.v1'});
}
