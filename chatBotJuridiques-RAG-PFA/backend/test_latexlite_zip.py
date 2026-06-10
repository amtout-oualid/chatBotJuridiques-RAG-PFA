import asyncio
import httpx
import io
import zipfile

async def main():
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zip_file:
        zip_file.writestr("main.tex", "\\documentclass{article}\\usepackage{graphicx}\\begin{document}hello\\end{document}")
        zip_file.writestr("test.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                "https://latexlite.com/v1/renders-sync",
                headers={"Authorization": "Bearer latexlite-key-8c4a25255be2fcec", "Content-Type": "application/zip"},
                content=zip_buffer.getvalue()
            )
            print("ZIP:", resp.status_code)
            print(resp.text[:200])
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
