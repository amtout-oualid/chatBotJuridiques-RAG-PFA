import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                "https://latexlite.com/v1/renders-sync",
                headers={"Authorization": "Bearer latexlite-key-8c4a25255be2fcec"},
                json={"template": "\\documentclass{article}\\begin{document}test\\end{document}"}
            )
            print(resp.status_code)
            print(resp.headers)
            print(resp.text[:200])
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
