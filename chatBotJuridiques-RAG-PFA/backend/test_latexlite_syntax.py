import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        try:
            files = {
                "template": ("main.tex", "\\documentclass{article}\\begin{document}\\undefinedcommand\\end{document}", "text/plain")
            }
            resp = await client.post(
                "https://latexlite.com/v1/renders-sync",
                headers={"Authorization": "Bearer latexlite-key-8c4a25255be2fcec"},
                files=files
            )
            print(resp.status_code)
            print(resp.text)
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
