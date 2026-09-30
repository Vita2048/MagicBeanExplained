import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const ffmpeg = process.argv[2];
if (!ffmpeg) throw Error('Usage: node build-voice.mjs <ffmpeg.exe>');
const voice = JSON.parse(fs.readFileSync('assets/voice-metadata.json', 'utf8'));
const speech = JSON.parse(fs.readFileSync('speech-input.json', 'utf8'));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const run = args => { const r = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], {encoding: 'utf8'}); if (r.status !== 0) throw Error(r.stderr || String(r.error)); };
const stamp = t => { let ms = Math.round(t * 1000); return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`; };

fs.mkdirSync('assets/narration', {recursive: true});
let start = 0;
const allCues = [];
const all = [];
for (const s of speech) {
  const v = voice.find(x => x.id === s.id);
  if (!v) throw Error('Missing voice for ' + s.id);
  let length = 0;
  const wordPositions = v.words.map(w => { const p = length; length += norm(w.text).length; return {...w, pos: p}; });
  const expected = norm(s.speech.join(' ')), received = v.words.map(w => norm(w.text)).join('');
  if (expected !== received) throw Error('Word alignment mismatch: ' + s.id + '\n' + expected + '\n' + received);
  const starts = s.speech.map((p, i) => { const pos = norm(s.speech.slice(0, i).join(' ')).length; return wordPositions.find(w => w.pos >= pos)?.start ?? 0; });
  const cuts = starts.map((x, i) => i === 0 ? 0 : (wordPositions.filter(w => w.start < x).at(-1).end + x) / 2);
  cuts.push(v.duration);
  const head = .8, tail = 2.1;
  let extra = Math.max(0, s.min - head - tail - v.duration);
  const gaps = s.speech.map((_, i) => i === 0 ? 0 : extra / (s.speech.length - 1));
  let offset = head;
  const pieces = [], localWords = [], phraseStarts = [];
  for (let k = 0; k < s.speech.length; k++) {
    offset += gaps[k];
    const from = cuts[k], to = cuts[k + 1];
    pieces.push({from, to, at: offset});
    phraseStarts.push(offset + starts[k] - from);
    localWords.push(...v.words.filter(w => w.start >= from && w.start < to).map(w => ({...w, start: w.start - from + offset, end: w.end - from + offset, phrase: k})));
    offset += to - from;
  }
  const duration = Math.ceil(Math.max(s.min, offset + tail) * 30) / 30;
  const meta = {id: s.id, title: s.title, chapter: s.chapter, takeaway: s.takeaway, start, duration, phraseStarts, words: localWords};
  const audioPath = `assets/narration/${s.id}.mp3`;
  const filter = pieces.map((p, i) => `[0:a]atrim=start=${p.from}:end=${p.to},asetpts=PTS-STARTPTS,adelay=${Math.round(p.at * 1000)}:all=1[p${i}]`).join(';') + ';' + pieces.map((_, i) => `[p${i}]`).join('') + `amix=inputs=${pieces.length}:normalize=0:duration=longest,asetpts=N/SR/TB,apad=pad_dur=${duration},atrim=duration=${duration},asetpts=N/SR/TB[out]`;
  run(['-i', `assets/voice-parts/${s.id}.mp3`, '-filter_complex', filter, '-map', '[out]', '-c:a', 'libmp3lame', '-b:a', '160k', audioPath]);
  for (let k = 0; k < s.speech.length; k++) {
    const words = localWords.filter(w => w.phrase === k);
    const count = Math.ceil(words.map(w => w.text).join(' ').length / 82);
    for (let j = 0; j < count; j++) {
      const part = words.slice(Math.round(j * words.length / count), Math.round((j + 1) * words.length / count));
      const clean = part.map(w => w.text).join(' ').replace(/\s+([.,;:!?])/g, '$1').replace(/Three\. js/g, 'Three.js');
      allCues.push({start: start + part[0].start, end: start + Math.min(part.at(-1).end + .16, duration), text: clean + (j === count - 1 ? '.' : '')});
    }
  }
  all.push(meta);
  start += duration;
}
for (let i = 0; i < allCues.length - 1; i++) allCues[i].end = Math.min(allCues[i].end, allCues[i + 1].start);
const total = Math.round(start * 30) / 30;

// Update index.html: refresh host durations/starts, refresh voice audio elements,
// refresh root caption cues (captions are driven by the MAIN timeline, 7Segment pattern)
let index = fs.readFileSync('index.html', 'utf8');
const fullCues = allCues.map(c => [c.start, c.end, c.text]);
index = index.replace(/data-duration="[\d.]+" data-fps/, `data-duration="${total}" data-fps`);
for (const m of all) {
  const hostId = m.id === 'opening' ? 'opening' : `lesson-${m.id}`;
  index = index.replace(new RegExp(`id="${hostId}"([^>]*?)data-start="[^"]+"([^>]*?)data-duration="[^"]+"`), `id="${hostId}"$1data-start="${m.start}"$2data-duration="${m.duration}"`);
}
// Remove any existing voice audio elements, then insert fresh ones before the root captions div
index = index.replace(/<audio id="voice-[^>]*><\/audio>\n?/g, '');
index = index.replace(/(<div id="captions" data-layout-allow-caption-zone>)/, all.map(m => `<audio id="voice-${m.id}" src="assets/narration/${m.id}.mp3" data-start="${m.start}" data-duration="${m.duration}" data-volume="1" data-track-index="1" data-audio-group="voiceover"></audio>`).join('\n') + '\n$1');
// Refresh root caption cues + driver duration
index = index.replace(/window\.captionCues=\[[\s\S]*?\];/, `window.captionCues=${JSON.stringify(fullCues)};`);
index = index.replace(/tl\.to\(driver,\{t:[\d.]+,duration:[\d.]+,ease:'none',onUpdate:\(\)=>\{const cue=cues\.find/, `tl.to(driver,{t:${total},duration:${total},ease:'none',onUpdate:()=>{const cue=cues.find`);
fs.writeFileSync('index.html', index);

// Keep the (unmounted) captions-track sub-composition file in sync for reference
let caps = fs.readFileSync('compositions/captions.html', 'utf8');
caps = caps.replace(/const subtitles=\[[\s\S]*?\];/, `const subtitles=${JSON.stringify(fullCues)};`);
caps = caps.replace(/data-duration="[\d.]+"/g, `data-duration="${total}"`);
caps = caps.replace(/\{t:\s*[\d.]+,duration:[\d.]+,ease:'none',onUpdate:\(\)=>window\.paintSubtitles\(clock\.t\)\}/, `{t:${total},duration:${total},ease:'none',onUpdate:()=>window.paintSubtitles(clock.t)}`);
caps = caps.replace(/tl\.to\(clock,\{t:[\d.]+,duration:[\d.]+/, `tl.to(clock,{t:${total},duration:${total}`);
fs.writeFileSync('compositions/captions.html', caps);

// Update per-scene composition durations where they changed (e.g. finish 30 -> 31.633)
for (const m of all) {
  const file = m.id === 'opening' ? 'compositions/opening.html' : `compositions/${m.id}.html`;
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  html = html.replace(new RegExp(`(data-composition-id="(?:lesson-)?${m.id === 'opening' ? 'opening' : m.id}"[^>]*?data-duration=")[\\d.]+(")`), `$1${m.duration}$2`);
  if (html !== before) fs.writeFileSync(file, html);
}
// Targeted fix for lesson compositions: driver + progress durations
for (const m of all) {
  if (m.id === 'opening') continue;
  const file = `compositions/${m.id}.html`;
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/tl\.to\(driver,\{t:[\d.]+,duration:[\d.]+/, `tl.to(driver,{t:${m.duration},duration:${m.duration}`);
  html = html.replace(/\{scaleX:1,duration:[\d.]+,ease:'none'\},0\)/, `{scaleX:1,duration:${m.duration},ease:'none'},0)`);
  fs.writeFileSync(file, html);
}
// Opening composition driver (stays 45 unless changed)
{
  const m = all.find(x => x.id === 'opening');
  const file = 'compositions/opening.html';
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/tl\.to\(driver,\{time:[\d.]+,duration:[\d.]+/, `tl.to(driver,{time:${m.duration},duration:${m.duration}`);
  html = html.replace(/\{scaleX:1,duration:[\d.]+,ease:'none'\},0\)/, `{scaleX:1,duration:${m.duration},ease:'none'},0)`);
  // refresh embedded subtitles preview array to measured local cues
  const local = allCues.filter(c => c.start >= m.start && c.start < m.start + m.duration).map(c => [+(c.start - m.start).toFixed(3), +(c.end - m.start).toFixed(3), c.text]);
  html = html.replace(/const subtitles=\[[\s\S]*?\];/, `const subtitles=${JSON.stringify(local)};`);
  fs.writeFileSync(file, html);
}

// timing.json: preserve chapters structure, update starts/durations, add phraseStarts/words, replace captions
const oldTiming = JSON.parse(fs.readFileSync('timing.json', 'utf8'));
const chapters = oldTiming.chapters.map(ch => {
  const m = all.find(x => x.id === ch.id);
  return {...ch, start: m.start, duration: m.duration, title: m.title, phraseStarts: m.phraseStarts, words: m.words};
});
fs.writeFileSync('timing.json', JSON.stringify({duration: total, chapters, captions: fullCues}, null, 2));
fs.writeFileSync('assets/voice.vtt', 'WEBVTT\n\n' + allCues.map(c => `${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}`).join('\n\n') + '\n');
fs.writeFileSync('assets/narration/concat.txt', all.map(m => `file '${m.id}.mp3'`).join('\n'));
run([...all.flatMap(m => ['-i', `assets/narration/${m.id}.mp3`]), '-filter_complex', all.map((m, i) => `[${i}:a]atrim=duration=${m.duration},asetpts=PTS-STARTPTS[a${i}]`).join(';') + ';' + all.map((_, i) => `[a${i}]`).join('') + `concat=n=${all.length}:v=0:a=1[out]`, '-map', '[out]', '-c:a', 'libmp3lame', '-b:a', '160k', 'assets/voice.mp3']);
console.log(`Built voice for ${all.length} scenes; ${total.toFixed(3)} seconds; ${allCues.length} caption cues.`);
