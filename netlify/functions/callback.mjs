// Vuelta del login con GitHub: comprueba el parámetro «state» (anti-CSRF) y que el usuario esté en GITHUB_ALLOWED_USERS antes de entregar el token a Decap.
export const page=(status,content)=>`<!doctype html><meta charset="utf-8"><script>(function(){var m='authorization:github:${status}:'+${JSON.stringify(JSON.stringify(content))};
function r(e){window.opener.postMessage(m,e.origin)}window.addEventListener('message',r,false);window.opener.postMessage('authorizing:github','*')})()</script>`;
export const allowed=(list,login)=>{const L=String(list||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);return L.length>0&&L.includes(String(login||'').toLowerCase())};
export default async req=>{
  const u=new URL(req.url),code=u.searchParams.get('code'),state=u.searchParams.get('state');
  const ck=(req.headers.get('cookie')||'').match(/(?:^|;\s*)fm_oauth=([a-f0-9]+)/),h={'content-type':'text/html; charset=utf-8','cache-control':'no-store','set-cookie':'fm_oauth=; Max-Age=0; Path=/api'};
  if(!code||!state||!ck||ck[1]!==state)return new Response(page('error',{message:'Estado de login no válido'}),{status:400,headers:h});
  try{
    const t=await(await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({client_id:process.env.GITHUB_CLIENT_ID,client_secret:process.env.GITHUB_CLIENT_SECRET,code})})).json();
    if(!t.access_token)return new Response(page('error',{message:'GitHub no devolvió token'}),{status:401,headers:h});
    const me=await(await fetch('https://api.github.com/user',{headers:{authorization:'Bearer '+t.access_token,'user-agent':'fm-mods-comunidad'}})).json();
    if(!allowed(process.env.GITHUB_ALLOWED_USERS,me.login))return new Response(page('error',{message:'Usuario no autorizado'}),{status:403,headers:h});
    return new Response(page('success',{token:t.access_token,provider:'github'}),{headers:h});
  }catch{return new Response(page('error',{message:'Error de login'}),{status:502,headers:h})}
};
export const config={path:'/api/callback'};
