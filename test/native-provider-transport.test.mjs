import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { postSettlementJson } from "../src/native-provider-runtime.mjs";

test("Provider-to-Settlement HTTP timeout covers headers and response body", async () => {
  const server = createServer((request, response) => {
    if (request.url === "/body") { response.writeHead(200, { "content-type": "application/json" }); response.write("{"); }
  });
  await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
  try {
    for (const path of ["/headers", "/body"]) {
      await assert.rejects(postSettlementJson(`http://127.0.0.1:${server.address().port}${path}`,
        "test-token", { orderId: "test-order" }, 60), (error) => error?.code === "SETTLEMENT_TIMEOUT");
    }
  } finally { server.closeAllConnections(); await new Promise((done) => server.close(done)); }
});

test('Provider requests new disclosure only from formal API, leaving x402 transport unchanged',async()=>{
 const captured=[];
 const server=createServer((req,res)=>{captured.push({path:req.url,accept:req.headers.accept});
  res.setHeader('content-type','application/json');res.end('{"ok":true,"result":{"finalization":null}}');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  for(const path of ['/agentpay/provider/orders/read','/x402/settle'])await postSettlementJson(`http://127.0.0.1:${server.address().port}${path}`,'test-token',{},30000,{finalizationV2:path.startsWith('/agentpay/provider/')});
  assert.equal(captured[0].accept,'application/vnd.agentpay.participant-order-v2+json, application/vnd.agentpay.finalization-v2+json, application/vnd.agentpay.order-deadlines-v2+json, application/vnd.agentpay.service-authorization-v2+json, application/vnd.agentpay.delivery-result-v2+json');assert.equal(captured[1].accept,'*/*');
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
