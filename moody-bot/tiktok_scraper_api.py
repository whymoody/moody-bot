from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from scrapling.fetchers import StealthyFetcher

app = FastAPI()


def extraer_datos_tiktok(username: str):
    url = f"https://www.tiktok.com/@{username}"
    print(f"[*] Iniciando scraping para: {username}")
    
    page = StealthyFetcher.fetch(url, headless=True, network_idle=True, timeout=30000)
    
    avatar = page.css('meta[property="og:image"]::attr(content)').get()
    nombre = page.css('h2[data-e2e="user-subtitle"]::text').get()
    usuario = page.css('h1[data-e2e="user-title"]::text').get()
    seguidores = page.css('strong[data-e2e="followers-count"]::text').get()
    siguiendo = page.css('strong[data-e2e="following-count"]::text').get()
    likes = page.css('strong[data-e2e="likes-count"]::text').get()
    bio = page.css('h2[data-e2e="user-bio"]::text').get()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Perfil no encontrado o cuenta privada")

    return {
        "status": "ok",
        "data": {
            "avatar": avatar,
            "nombre": nombre,
            "usuario": usuario,
            "seguidores": seguidores,
            "siguiendo": siguiendo,
            "likes": likes,
            "bio": bio
        }
    }

@app.get("/stalk/{username}")
async def stalk_tiktok(username: str):
    try:
        
        resultado = await run_in_threadpool(extraer_datos_tiktok, username)
        print(f"[✓] Datos extraídos correctamente para: {username}")
        return resultado
    except HTTPException:
        raise
    except Exception as e:
        print(f"[X] ERROR CRÍTICO scraping {username}: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {repr(e)}")