// THE DAY IN ONE PICTURE — deterministic, dependency-free newspaper renderer.
// Run with: MAKEFUN_OUTPUT_DIR=out node main.ts
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const W = 1024, H = 1024;
const pixels = Buffer.alloc(W * H * 4);
const ink = [27, 26, 23, 255], muted = [97, 91, 79, 255], red = [164, 45, 35, 255];
const paper = [246, 241, 226, 255];
let seed = 0x19a26;
function rand() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
function pixel(x,y,c) { x|=0; y|=0; if(x<0||y<0||x>=W||y>=H)return; const i=(y*W+x)*4; pixels[i]=c[0];pixels[i+1]=c[1];pixels[i+2]=c[2];pixels[i+3]=c[3]??255; }
function rect(x,y,w,h,c) { const x0=Math.max(0,Math.floor(x)), y0=Math.max(0,Math.floor(y)), x1=Math.min(W,Math.ceil(x+w)), y1=Math.min(H,Math.ceil(y+h)); for(let yy=y0;yy<y1;yy++) for(let xx=x0;xx<x1;xx++)pixel(xx,yy,c); }
function line(x0,y0,x1,y1,c,t=2) { const dx=x1-x0,dy=y1-y0,n=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))); for(let i=0;i<=n;i++){const x=x0+dx*i/(n||1),y=y0+dy*i/(n||1),r=t/2; for(let yy=Math.floor(y-r);yy<=y+r;yy++)for(let xx=Math.floor(x-r);xx<=x+r;xx++)if((xx-x)**2+(yy-y)**2<=r*r+1)pixel(xx,yy,c);} }
function circle(cx,cy,r,c,fill=true,t=2) { const rr=r*r, inner=(r-t)*(r-t); for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++){const d=(x-cx)**2+(y-cy)**2;if(fill?d<=rr:d<=rr&&d>=inner)pixel(x,y,c);} }
function poly(points,c,fill=true,t=2) { if(fill){let minY=H,maxY=0;for(const p of points){minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);} for(let y=Math.floor(minY);y<=maxY;y++){const xs=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y))xs.push((b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]);}xs.sort((a,b)=>a-b);for(let i=0;i<xs.length;i+=2)for(let x=Math.ceil(xs[i]);x<=xs[i+1];x++)pixel(x,y,c);}}else for(let i=0;i<points.length;i++)line(...points[i],...points[(i+1)%points.length],c,t); }
// 5x7 block font. Each glyph is authored here; scaling keeps small copy crisp and bold.
const G={
A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],G:['01111','10000','10000','10111','10001','10001','01111'],H:['10001','10001','10001','11111','10001','10001','10001'],I:['11111','00100','00100','00100','00100','00100','11111'],J:['00111','00010','00010','00010','10010','10010','01100'],K:['10001','10010','10100','11000','10100','10010','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],M:['10001','11011','10101','10101','10001','10001','10001'],N:['10001','11001','11001','10101','10011','10011','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],Q:['01110','10001','10001','10001','10101','10010','01101'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','10001','01010','00100'],W:['10001','10001','10001','10101','10101','10101','01010'],X:['10001','10001','01010','00100','01010','10001','10001'],Y:['10001','10001','01010','00100','00100','00100','00100'],Z:['11111','00001','00010','00100','01000','10000','11111'],
'0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'4':['00010','00110','01010','10010','11111','00010','00010'],'5':['11111','10000','10000','11110','00001','00001','11110'],'6':['01110','10000','10000','11110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],'8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00001','01110'],
'.':['00000','00000','00000','00000','00000','00110','00110'],',':['00000','00000','00000','00000','00110','00110','00100'],"'":['00100','00100','00010','00000','00000','00000','00000'],'’':['00100','00100','00010','00000','00000','00000','00000'],'-':['00000','00000','00000','11111','00000','00000','00000'],'–':['00000','00000','00000','11111','00000','00000','00000'],'—':['00000','00000','00000','11111','00000','00000','00000'],'·':['00000','00000','00100','00000','00000','00000','00000'],'•':['00000','00000','01110','01110','01110','00000','00000'],':':['00000','00110','00110','00000','00110','00110','00000'],'%':['11001','11010','00100','01000','10110','00110','00000'],'$':['00100','01111','10100','01110','00101','11110','00100'],'€':['00111','01000','11110','01000','11110','01000','00111'],'£':['00110','01001','01000','11100','01000','01000','11111'],'/':['00001','00010','00010','00100','01000','01000','10000'],'&':['01100','10010','10100','01000','10101','10010','01101'],'!':['00100','00100','00100','00100','00100','00000','00100'],'?':['01110','10001','00001','00010','00100','00000','00100'],'(':['00010','00100','01000','01000','01000','00100','00010'],')':['01000','00100','00010','00010','00010','00100','01000']," ":['00000','00000','00000','00000','00000','00000','00000']};
function measure(s,scale,spacing=1){return [...s].reduce((n,ch)=>n+(ch===' '?4:6)*scale+spacing,0)-spacing;}
function text(s,x,y,scale,c=ink,spacing=1){let xx=x;for(const raw of s){const ch=G[raw]||G[raw.toUpperCase()]||G[' '];for(let r=0;r<7;r++)for(let col=0;col<5;col++)if(ch[r][col]==='1')rect(xx+col*scale,y+r*scale,scale,scale,c);xx+=(raw===' '?4:6)*scale+spacing;}}
function wrap(s,max,scale,spacing=1){const words=s.split(' '),lines=[];let cur='';for(const w of words){const test=cur?cur+' '+w:w;if(measure(test,scale,spacing)>max&&cur){lines.push(cur);cur=w;}else cur=test;}if(cur)lines.push(cur);return lines;}
function paragraph(s,x,y,max,scale,c=ink,leading=scale*9,spacing=1,limit=5){const lines=wrap(s,max,scale,spacing).slice(0,limit);lines.forEach((l,i)=>text(l,x,y+i*leading,scale,c,spacing));return y+lines.length*leading;}
// Warm stock, fine seeded fibers and flecks.
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const n=(rand()*7)|0;pixel(x,y,[paper[0]-n,paper[1]-n,paper[2]-n,255]);}
function rule(y,x=36,w=952,t=2,c=ink){rect(x,y,w,t,c);}
// Masthead
rect(0,0,W,154,ink);text('THE DAY IN ONE PICTURE',38,23,5,[250,246,234,255],1);rect(38,91,948,3,red);text('THURSDAY · 19 NOVEMBER 2026 · THE WORLD\'S NEWS IN A SINGLE IMAGE',40,111,2,[250,246,234,255],1);
// Lead story: broad left headline, illustrated court to the right.
text('THE HAGUE · INTERNATIONAL COURT OF JUSTICE',38,172,2,red,1);rect(38,193,946,1,ink);
const lead=['WORLD COURT RULES','MYANMAR COMMITTED','GENOCIDE AGAINST','THE ROHINGYA'];lead.forEach((l,i)=>text(l,38,209+i*43,5,ink,1));
paragraph('JUDGES VOTE 9–6 FOR THE GAMBIA: THE 2017 CRACKDOWN BREACHED THE GENOCIDE CONVENTION — RESTITUTION ORDERED.',40,393,570,2,ink,20,1,3);
// Court/globe icon, etched in restrained red and ink.
const cx=806, top=235;circle(cx,top+75,61,[211,203,184,255],false,2);circle(cx,top+75,49,[211,203,184,255],false,1);line(cx-48,top+75,cx+48,top+75,[211,203,184,255],1);line(cx,top+27,cx,top+123,[211,203,184,255],1);
poly([[cx-88,top+67],[cx,top+31],[cx+88,top+67]],ink,true);poly([[cx-88,top+67],[cx,top+31],[cx+88,top+67]],paper,false,2);rect(cx-83,top+69,166,9,red);for(let i=0;i<5;i++){const x=cx-68+i*34;rect(x,top+82,12,73,ink);rect(x+3,top+84,6,69,paper);}rect(cx-91,top+155,182,10,ink);rect(cx-103,top+168,206,12,ink);
// Justice scales in front of globe.
line(cx,top+43,cx,top+115,red,3);line(cx-30,top+59,cx+30,top+59,red,3);line(cx-30,top+59,cx-43,top+84,red,2);line(cx-30,top+59,cx-18,top+84,red,2);line(cx+30,top+59,cx+18,top+84,red,2);line(cx+30,top+59,cx+43,top+84,red,2);line(cx-46,top+84,cx-14,top+84,red,3);line(cx+14,top+84,cx+46,top+84,red,3);circle(cx,top+39,5,red);line(cx-23,top+117,cx+23,top+117,red,4);
rule(449);
// Five compact briefs: three across, then two wider panels.
const panels=[
{x:38,y:465,w:302,h:215,k:'SHENZHEN SUMMIT',h:'TRUMP, XI AND PUTIN ISSUE JOINT PEACE DECLARATION',s:'Three leaders pledge nuclear-risk talks at first three-way summit — but sign no peace deal.',icon:'mount'},
{x:361,y:465,w:302,h:215,k:'WALL STREET',h:'ANTHROPIC SOARS IN RECORD $81BN IPO DEBUT',s:'Opens +34% at $111.50, closes $97.17 — largest listing ever, briefly worth $2 trillion.',icon:'chart'},
{x:684,y:465,w:302,h:215,k:'UKRAINE WAR',h:"UKRAINE HITS KERCH BRIDGE AGAIN; PUTIN VOWS 'PAINFUL' REPLY",s:'Third strike in four days as allies meet in Berlin — Zelenskyy seeks €115bn for 2027.',icon:'bridge'},
{x:38,y:692,w:464,h:215,k:'THE ARCTIC',h:'DENMARK BACKS GREENLAND-US SECURITY PACT',s:'All 109 MPs approve the expanded Arctic defence arrangement.',icon:'ice'},
{x:521,y:692,w:465,h:215,k:'THE ART MARKET',h:'VAN GOGH SELLS FOR A RECORD $190.4M',s:'Auction record set after a row over the painting’s Nazi-era history.',icon:'art'}];
function icon(type,x,y,w){const c=red, base=y+55;if(type==='mount'){line(x+5,base,x+w-5,base,ink,2);poly([[x+10,base],[x+48,y+4],[x+86,base]],ink,true);poly([[x+70,base],[x+121,y-7],[x+170,base]],red,true);poly([[x+152,base],[x+201,y+11],[x+250,base]],ink,true);for(const [fx,fy] of [[x+44,y+1],[x+119,y-8],[x+199,y+10]]){line(fx,fy,fx,fy-19,ink,2);poly([[fx,fy-19],[fx+13,fy-15],[fx,fy-11]],red,true);}}
if(type==='chart'){for(let i=0;i<5;i++)rect(x+12+i*27,base-(15+i*8),16,15+i*8,[113,120,97,255]);line(x+8,base-8,x+139,y+1,c,4);line(x+139,y+1,x+127,y+3,c,4);line(x+139,y+1,x+135,y+13,c,4);text('ANT',x+166,y+4,2,ink);}
if(type==='bridge'){line(x+6,base,x+w-8,base,[68,105,123,255],3);for(let i=0;i<7;i++)line(x+4+i*39,base+7,x+25+i*39,base+3,[68,105,123,255],2);line(x+15,y+14,x+w-15,y+14,ink,4);for(let i=0;i<8;i++)line(x+22+i*34,y+14,x+22+i*34,base-8,ink,2);poly([[x+15,y+14],[x+45,y-3],[x+75,y+14]],red,true);poly([[x+w-75,y+14],[x+w-45,y-3],[x+w-15,y+14]],red,true);}
if(type==='ice'){for(let i=0;i<5;i++)line(x+i*(w/4),base,x+28+i*(w/4),y+10+((i%2)*12),[102,143,154,255],3);line(x,y+25,x+w,y+25,[80,137,156,255],2);line(x+4,y+34,x+w-4,y+34,[80,137,156,255],2);rect(x+17,base,w-34,3,ink);}
if(type==='art'){rect(x+15,y+3,104,59,ink);rect(x+21,y+9,92,47,[221,181,103,255]);circle(x+66,y+32,17,[68,103,67,255],false,3);for(let i=0;i<8;i++){const a=i*Math.PI/4;line(x+66+Math.cos(a)*8,y+32+Math.sin(a)*8,x+66+Math.cos(a)*22,y+32+Math.sin(a)*22,[200,119,47,255],2);}circle(x+66,y+32,4,[179,75,39,255]);}
}
for(const p of panels){
  const pad=9, inner=p.w-2*pad, bottom=p.y+215-7;
  rect(p.x,p.y,p.w,1,ink);
  const kickerY=p.y+8; text(p.k,p.x+pad,kickerY,2,red);
  const kickerBottom=kickerY+14;
  const subLines=wrap(p.s,inner,1,1), subLeading=10, subHeight=subLines.length*subLeading;
  // Icons occupy an 81px vertical envelope (their authored geometry extends
  // 19px above and 62px below the anchor). Reduce headline scale until every
  // measured text block and that envelope fit between the panel borders.
  let chosen=null;
  for(let scale=3;scale>=1;scale--){
    const lines=wrap(p.h,inner,scale,1), leading=Math.ceil(scale*9); // >= 1.28x glyph height
    const headlineY=kickerBottom+6, headlineBottom=headlineY+lines.length*leading;
    const subY=headlineBottom+6, subBottom=subY+subHeight;
    const iconAnchor=subBottom+8+19;
    if(iconAnchor+62<=bottom){chosen={scale,lines,leading,headlineY,subY,iconAnchor};break;}
  }
  if(!chosen) throw new Error(`Panel content cannot fit: ${p.h}`);
  chosen.lines.forEach((lineText,i)=>text(lineText,p.x+pad,chosen.headlineY+i*chosen.leading,chosen.scale,ink));
  subLines.forEach((lineText,i)=>text(lineText,p.x+pad,chosen.subY+i*subLeading,1,ink));
  icon(p.icon,p.x+8,chosen.iconAnchor,p.w-16);
}
// Ticker and footer.
rect(0,924,W,100,ink);rect(0,924,W,5,red);text('ALSO TODAY',35,941,2,[232,174,101,255]);paragraph('US SENATE REJECTS IRAN WAR-POWERS MEASURE 51–48 · WALMART SALES HIT $188.8BN AS OUTLOOK IS RAISED · UK AND NORWAY FUND £100M+ UKRAINIAN NAVAL PROGRAMME',35,964,950,2,[250,246,234,255],20,1,2);
// PNG: filter type 0 on every scanline, RGBA, zlib stream, standard CRC32 chunks.
const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(buf){let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),out=Buffer.alloc(12+data.length);out.writeUInt32BE(data.length,0);name.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([name,data])),8+data.length);return out;}
const raw=Buffer.alloc(H*(1+W*4));for(let y=0;y<H;y++){const o=y*(1+W*4);raw[o]=0;pixels.copy(raw,o+1,y*W*4,(y+1)*W*4);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
const outDir=process.env.MAKEFUN_OUTPUT_DIR??'/output';fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(path.join(outDir,'entry.png'),png);
