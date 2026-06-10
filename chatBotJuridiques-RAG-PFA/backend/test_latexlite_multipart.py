import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        try:
            files = {
                "template": ("main.tex", "\\documentclass{article}\\usepackage{graphicx}\\begin{document}\\includegraphics{test.png}\\end{document}", "text/plain"),
                "test.png": ("test.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82", "image/png")
            }
            resp = await client.post(
                "https://latexlite.com/v1/renders-sync",
                headers={"Authorization": "Bearer latexlite-key-8c4a25255be2fcec"},
                files=files
            )
            print(resp.status_code)
            if resp.status_code != 200:
                print(resp.text)
            else:
                print("Success! Size:", len(resp.content))
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
