import fs from 'node:fs';
import crypto from 'node:crypto';
// Original note arrangement and synthesized instruments. No recordings,
// sample packs, soundfonts, pretrained music models, or external compositions.
const sr=44100,duration=36,n=Math.ceil(sr*duration),bpm=84,beat=60/bpm;
const left=new Float32Array(n),right=new Float32Array(n);
let seed=937561;const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
const hz=m=>440*2**((m-69)/12),tau=2*Math.PI;
function add(start,len,pan,fn,gain=1){const base=Math.round(start*sr),count=Math.round(len*sr),l=Math.sqrt((1-pan)/2),r=Math.sqrt((1+pan)/2);for(let i=0;i<count&&base+i<n;i++){if(base+i<0)continue;const s=fn(i/sr,i)*gain;left[base+i]+=s*l;right[base+i]+=s*r;}}
function pad(start,notes,len){notes.forEach((m,j)=>{const f=hz(m);add(start,len+1.6,(j-1.5)*.27,t=>{const env=Math.min(1,t/.7)*Math.min(1,Math.max(0,(len+1.6-t)/1.6));return env*(Math.sin(tau*f*t)+.22*Math.sin(tau*f*2*t+.17)+.15*Math.sin(tau*f*1.002*t))*.032;});});}
function pluck(start,m,pan,accent=1){const f=hz(m);add(start,2.8,pan,t=>(1-Math.exp(-t*250))*(Math.sin(tau*f*t)*Math.exp(-t*3.3)+.24*Math.sin(tau*f*2.005*t)*Math.exp(-t*6)+.08*Math.sin(tau*f*3.99*t)*Math.exp(-t*12))*.12*accent);}
function bass(start,m){const f=hz(m);add(start,1.5,0,t=>Math.min(1,t/.018)*Math.exp(-t*2.7)*(Math.sin(tau*f*t)+.16*Math.sin(tau*f*2*t))*.12);}
function kick(start){add(start,.32,0,t=>Math.sin(tau*(45*t+42*.025*(1-Math.exp(-t/.025))))*Math.exp(-t*19)*Math.min(1,t/.004)*.11);}
function hat(start,pan,accent){let prev=0;add(start,.1,pan,t=>{const x=noise(),y=x-prev;prev=x;return y*Math.exp(-t*55)*Math.min(1,t/.002)*.012*accent;});}
function click(start){add(start,.16,.18,t=>noise()*Math.exp(-t*34)*Math.min(1,t/.003)*.018);}
const chords=[[50,57,60,64],[48,55,59,64],[46,53,57,60],[48,55,62,65],[50,57,60,64],[46,53,60,65]];
const basses=[38,36,34,36,38,34];
const patterns=[[0,2,1,3,2,1],[1,3,2,0,3,2],[0,1,3,2,1,3],[2,0,1,3,2,0]];
const offsets=[0,.75,1.5,2.5,3.25,3.75];
for(let bar=0;bar<12;bar++){
 const at=bar*4*beat,ci=Math.floor(bar/2),ch=chords[ci];
 pad(at,ch,4*beat);
 const pattern=patterns[bar%4];
 offsets.forEach((o,k)=>{if(bar===0&&k>3)return;pluck(at+o*beat,ch[pattern[k]]+12,k%2?-.26:.28,k===0?.9:.62);});
 bass(at,basses[ci]);if(bar>1)bass(at+2.5*beat,basses[ci]+(bar%2?7:0));
 if(bar>=2){kick(at);kick(at+2*beat);click(at+beat);click(at+3*beat);for(let j=0;j<8;j++)hat(at+j*beat/2,j%2?.35:-.35,j%2?.65:1);}
}
// Fixed stereo echoes give the mallets room without using an impulse sample.
const dryL=left.slice(),dryR=right.slice();
for(const [sec,g] of [[beat*.75,.18],[beat*1.5,.09],[.079,.055],[.131,.045]]){const delay=Math.round(sec*sr);for(let i=delay;i<n;i++){left[i]+=dryR[i-delay]*g;right[i]+=dryL[i-delay]*g;}}
let peak=0;for(let i=0;i<n;i++){const t=i/sr,fade=Math.min(1,t/1.8)*Math.min(1,Math.max(0,(duration-t)/3));left[i]=Math.tanh(left[i]*1.1)*fade;right[i]=Math.tanh(right[i]*1.1)*fade;peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));}
const gain=.72/peak,buf=Buffer.alloc(44+n*4);buf.write('RIFF');buf.writeUInt32LE(buf.length-8,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(2,22);buf.writeUInt32LE(sr,24);buf.writeUInt32LE(sr*4,28);buf.writeUInt16LE(4,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(n*4,40);
let sum=0;for(let i=0;i<n;i++){const l=left[i]*gain,r=right[i]*gain;sum+=l*l+r*r;buf.writeInt16LE(Math.round(l*32767),44+i*4);buf.writeInt16LE(Math.round(r*32767),46+i*4);}
fs.mkdirSync('assets/audio',{recursive:true});const file='assets/audio/geometry-in-motion-sample.wav';fs.writeFileSync(file,buf);
const meta={title:'Geometry in Motion — music sample',duration,bpm,sampleRate:sr,channels:2,peakDbFS:20*Math.log10(.72),rmsDbFS:20*Math.log10(Math.sqrt(sum/(2*n))),sha256:crypto.createHash('sha256').update(buf).digest('hex'),method:'Original coded note arrangement; local additive/FM-style synthesis and seeded noise percussion.',thirdPartyAudio:'None',externalMusicModels:'None',purpose:'36-second review sample only; not placed on video timeline.',rightsNote:'No third-party recording, soundfont, sample pack or composition was intentionally used. This provenance is not legal clearance or a guarantee against similarity or Content ID claims.'};
fs.writeFileSync('assets/audio/music-sample-provenance.json',JSON.stringify(meta,null,2));console.log(JSON.stringify(meta,null,2));
