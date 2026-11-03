import {paymentEndpointForService} from '@agentpay/types';
import {providerBase} from './service-url.mjs';

export function providerServiceUrls(publicBaseUrl,serviceId){
 const publicBase=providerBase(publicBaseUrl,'Provider public base');
 const localMcpPath=`/services/${encodeURIComponent(serviceId)}/mcp`;
 const mcpEndpoint=`${publicBase}${localMcpPath}/invoke`;
 const paymentEndpoint=paymentEndpointForService(mcpEndpoint,serviceId);
 return Object.freeze({publicBase,mcpEndpoint,paymentEndpoint,localMcpPath,
  publicMcpPath:new URL(mcpEndpoint).pathname.replace(/\/invoke$/,''),
  localPaymentPath:`/services/${encodeURIComponent(serviceId)}/agentpay/invoke`,
  publicPaymentPath:new URL(paymentEndpoint).pathname});
}
export function providerBaseForEndpoint(mcpEndpoint,serviceId){
 paymentEndpointForService(mcpEndpoint,serviceId);
 const suffix=`/services/${encodeURIComponent(serviceId)}/mcp/invoke`;
 return mcpEndpoint.slice(0,-suffix.length);
}
