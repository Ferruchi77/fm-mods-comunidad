#!/usr/bin/env node
// Cambia el login del panel de Netlify Identity / Git Gateway (obsoletos) a GitHub OAuth (netlify/functions/auth.mjs y callback.mjs).
//   node scripts/migrar-cms.js USUARIO/REPO [--url https://tu-sitio]     migra
//   node scripts/migrar-cms.js --atras                                    vuelve a Git Gateway
// Antes: crea la OAuth App en GitHub (callback https://TU-SITIO/api/callback) y define en Netlify GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET y GITHUB_ALLOWED_USERS.
const fs=require('fs');
const CFG='public/admin/config.yml',IDX='public/admin/index.html';
const W='<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>';
const args=process.argv.slice(2),back=args.includes('--atras');
const GG='backend:\n  name: git-gateway\n  branch: main\n';
const re=/^backend:\n(?:[ \t]+.*\n)+/m;
let c=fs.readFileSync(CFG,'utf8'),h=fs.readFileSync(IDX,'utf8');
if(back){c=c.replace(re,GG);if(!h.includes('netlify-identity-widget'))h=h.replace('<body>','<body>'+W)}
else{
  const repo=args.find(a=>/^[\w.-]+\/[\w.-]+$/.test(a));if(!repo){console.error('Uso: node scripts/migrar-cms.js USUARIO/REPO [--url https://tu-sitio] | --atras');process.exit(1)}
  const ui=args.indexOf('--url'),url=ui>=0?args[ui+1]:(c.match(/^site_url:\s*(\S+)/m)||[])[1];if(!url){console.error('Indica --url https://tu-sitio');process.exit(1)}
  c=c.replace(re,`backend:\n  name: github\n  repo: ${repo}\n  branch: main\n  base_url: ${url}\n  auth_endpoint: api/auth\n`);
  h=h.replace(W,'');
}
fs.writeFileSync(CFG,c);fs.writeFileSync(IDX,h);
console.log(back?'Panel: vuelve a Netlify Identity / Git Gateway.':'Panel: login con GitHub. Despliega y comprueba /admin/ antes de borrar Identity.');
