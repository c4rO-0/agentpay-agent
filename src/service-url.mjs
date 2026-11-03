// A deployment base may include an ingress prefix. Local control stays separate.
function normalizedBase(value,label) {
 if(typeof value!=='string'||value!==value.trim()||value.includes('\\'))throw Error(`Invalid ${label}`);
 const rawPath=/^[a-z]+:\/\/[^/?#]+([^?#]*)/.exec(value)?.[1];
 if(rawPath===undefined||!/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]*$/.test(rawPath||'/'))throw Error(`Invalid ${label} path`);
 const url=new URL(value);
 if(url.username||url.password||url.search||url.hash||!['http:','https:'].includes(url.protocol))throw Error(`${label} must use HTTP or HTTPS`);
 return url.origin+url.pathname.replace(/\/+$/,'');
}
// Public Provider service transport is independent of platform login/credentials.
export function providerBase(value,label='Provider URL') {return normalizedBase(value,label);}
export function serviceBase(value,label='Platform URL') {
 const base=normalizedBase(value,label),url=new URL(base);
 if(url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw Error(`${label} must use HTTPS or loopback HTTP`);
 return base;
}
export function serviceUrl(base,path) {
 if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//')||path.includes('#')||path.includes('\\'))throw Error('Invalid service endpoint');
 const normalized=serviceBase(String(base));
 const url=new URL(path.slice(1),normalized+'/');
 if(url.origin!==new URL(normalized).origin||!url.pathname.startsWith(new URL(normalized).pathname.replace(/\/$/,'')+'/'))throw Error('Endpoint escapes service base');
 return url;
}
