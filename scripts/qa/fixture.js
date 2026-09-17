import { createHandler } from '../../api/quote.js';
// Explicit local-only demonstration. It never contacts Redis or Resend.
export function fixture(mode) {
  const env={INQUIRY_FORM_ENABLED:'true',RESEND_API_KEY:'local-test-only',UPSTASH_REDIS_REST_URL:'https://fixture.upstash.io',UPSTASH_REDIS_REST_TOKEN:'local-test-only',INQUIRY_HASH_SECRET:'local-test-only-not-a-production-secret'};
  return createHandler({env,
    limiter:async()=>({allowed:mode!=='rate-limit',retryAfter:60}),
    fetcher:async()=>{
      if(mode==='unavailable') throw new Error('Simulated connection failure');
      return new Response(JSON.stringify(mode==='accepted'?{id:'fixture-message-123'}:{name:'validation_error',message:'Simulated provider rejection'}),{status:mode==='accepted'?200:422});
    },
  });
}
