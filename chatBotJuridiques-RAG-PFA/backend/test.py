import asyncio
async def test():
    try:
        proc = await asyncio.create_subprocess_exec('pdflatex', '-v')
    except Exception as e:
        print('CAUGHT:', type(e))

if __name__ == '__main__':
    asyncio.run(test())
