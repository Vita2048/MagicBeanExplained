import asyncio, json, pathlib, subprocess, sys
import edge_tts
import edge_tts.communicate
# Add the Windows trust store while retaining hostname and certificate checks.
edge_tts.communicate._SSL_CTX.load_default_certs()

root = pathlib.Path(__file__).parent
scenes = json.loads((root/'speech-input.json').read_text(encoding='utf-8'))
probe = sys.argv[1]
semaphore = asyncio.Semaphore(3)

async def one(scene):
    async with semaphore:
        base=root/'assets'/'voice-parts'/scene['id']
        base.parent.mkdir(parents=True,exist_ok=True)
        text=' '.join(scene['speech'])
        base.with_suffix('.txt').write_text(text,encoding='utf-8')
        if base.with_suffix('.json').exists() and base.with_suffix('.mp3').exists():
            return json.loads(base.with_suffix('.json').read_text())
        for attempt in range(3):
            try:
                words=[]
                communicate=edge_tts.Communicate(text,'en-US-AndrewNeural',rate='-5%',boundary='WordBoundary')
                with base.with_suffix('.mp3').open('wb') as f:
                    async for item in communicate.stream():
                        if item['type']=='audio': f.write(item['data'])
                        elif item['type']=='WordBoundary':
                            words.append({'start':item['offset']/10000000,'end':(item['offset']+item['duration'])/10000000,'text':item['text']})
                duration=float(subprocess.check_output([probe,'-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(base.with_suffix('.mp3'))],text=True))
                data={'id':scene['id'],'duration':duration,'words':words,'voice':'en-US-AndrewNeural','rate':'-5%'}
                base.with_suffix('.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
                print(f"{scene['id']}: {duration:.2f}s, {len(words)} timed words",flush=True)
                return data
            except Exception as e:
                if attempt==2: raise
                print(f'Retry {scene["id"]}: {e}',flush=True)
                await asyncio.sleep(2)

async def main():
    results=await asyncio.gather(*(one(s) for s in scenes))
    (root/'assets'/'voice-metadata.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
asyncio.run(main())
