// Inicio del login con GitHub para el panel (Decap CMS, backend «github»). Alternativa a Netlify Identity / Git Gateway (obsoletos).
// Variables de entorno en Netlify: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET y GITHUB_ALLOWED_USERS (logins de GitHub separados por comas).
// En GitHub → Settings → Developer settings → OAuth Apps: «Authorization callback URL» = https://TU-SITIO/api/callback
import {randomBytes} from 'node:crypto';
export default async req=>{
  const id=process.env.GITHUB_CLIENT_ID;
  if(!id)return new Response('Falta GITHUB_CLIENT_ID',{status:500});
  const state=randomBytes(16).toString('hex'),u=new URL(req.url);
  const to=new URL('https://github.com/login/oauth/authorize');
  to.searchParams.set('client_id',id);to.searchParams.set('scope','repo,user');to.searchParams.set('state',state);
  to.searchParams.set('redirect_uri',`${u.origin}/api/callback`);
  return new Response(null,{status:302,headers:{location:to.toString(),'set-cookie':`fm_oauth=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api; Max-Age=600`,'cache-control':'no-store'}});
};
export const config={path:'/api/auth'};
