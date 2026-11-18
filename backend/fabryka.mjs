export class BielikError extends Error {
  constructor(message,status=502,code='provider_error',retryAfter=null) {
    super(message);this.status=status;this.code=code;this.retryAfter=retryAfter;
  }
}

export function fabrykaConfig(env={}) {
  const key=String(env.FABRYKA_API_KEY||'').trim();
  if(!key)throw new BielikError('Czat nie jest jeszcze skonfigurowany na serwerze.',503,'not_configured');
  let url;
  try{url=new URL(String(env.FABRYKA_BASE_URL||'https://fabryka.ai/v1').replace(/\/+$/,''));}catch{}
  // An erroneous configuration must never send the secret to another host.
  if(!url||url.protocol!=='https:'||url.hostname!=='fabryka.ai'||url.port||url.username||url.password||url.search||url.hash||url.pathname!=='/v1') {
    throw new BielikError('Konfiguracja połączenia z Fabryką AI wymaga poprawy.',503,'invalid_config');
  }
  const model=String(env.FABRYKA_MODEL||'bielik-11b-v3.1');
  if(!/^bielik-[a-zA-Z0-9._-]{1,80}$/.test(model))throw new BielikError('Konfiguracja modelu Bielik wymaga poprawy.',503,'invalid_config');
  return {key,model,endpoint:`${url.href}/chat/completions`};
}

export async function fabrykaCompletion(config,messages,{fetcher=fetch,signal}={}) {
  let response;
  try {
    response=await fetcher(config.endpoint,{
      method:'POST',redirect:'error',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(45000)]):AbortSignal.timeout(45000),
      headers:{Authorization:`Bearer ${config.key}`,'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({model:config.model,messages,stream:false,temperature:0.15,max_tokens:1100,response_format:{type:'json_object'}})
    });
  } catch(error) {
    if(error.name==='TimeoutError'||error.name==='AbortError')throw new BielikError('Odpowiedź trwa zbyt długo. Spróbuj ponownie za chwilę.',504,'timeout');
    throw new BielikError('Nie udało się połączyć z Doktorem Bielikiem. Spróbuj ponownie.',502,'connection_error');
  }
  if(!response.ok) {
    await response.body?.cancel().catch(()=>{});
    if(response.status===429){const delay=Number(response.headers.get('Retry-After'));throw new BielikError('Fabryka AI osiągnęła limit zapytań. Spróbuj ponownie później.',429,'provider_rate_limit',Number.isFinite(delay)&&delay>0?Math.min(3600,Math.ceil(delay)):60);}
    if([401,403].includes(response.status))throw new BielikError('Dostęp do modelu wymaga sprawdzenia konfiguracji przez administratora.',502,'provider_auth');
    if(response.status===402)throw new BielikError('Fabryka AI nie może teraz obsłużyć zapytania w tym planie.',503,'provider_plan');
    throw new BielikError('Model jest chwilowo niedostępny. Spróbuj ponownie za chwilę.',502,'provider_unavailable');
  }
  let payload;
  try {
    const reader=response.body.getReader(),chunks=[];let size=0;
    try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>200000)throw new Error();chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    payload=JSON.parse(new TextDecoder().decode(bytes));
    const content=payload.choices?.[0]?.message?.content;
    if(typeof content!=='string'||payload.choices[0].finish_reason==='length')throw new Error();
    const data=JSON.parse(content.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
    // A refusal has no model-written text or citations to display. Some model
    // responses omit these otherwise required fields on this path.
    if(data.kind==='out_of_scope')return {data:{kind:'out_of_scope',answer:'',source_ids:[]},model:config.model,usage:null};
    if(!['source','profile','clarification','no_evidence'].includes(data.kind)||typeof data.answer!=='string'||!Array.isArray(data.source_ids))throw new Error();
    return {data,model:config.model,usage:payload.usage?{prompt_tokens:payload.usage.prompt_tokens,completion_tokens:payload.usage.completion_tokens}:null};
  } catch {
    throw new BielikError('Model nie zwrócił kompletnej odpowiedzi. Spróbuj ponownie.',502,'invalid_response');
  }
}
