import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        try:
            files = {
                "template": ("main.tex", "\\documentclass{article}\\usepackage{graphicx}\\begin{document}\\includegraphics{test.png}\\end{document}", "text/plain"),
                "test.png": ("test.png", b"dummy", "image/png")
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
