from fastapi import FastAPI, HTTPException
import httpx

app = FastAPI()

@app.get("/robloxstalk/{username}")
async def robloxstalk(username: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        async with httpx.AsyncClient() as client:
            
            res_id = await client.post(
                "https://users.roblox.com/v1/usernames/users",
                json={"usernames": [username], "excludeBannedUsers": False},
                headers=headers,
                timeout=15
            )
            data_id = res_id.json()
            
            if not data_id.get("data"):
                raise HTTPException(status_code=404, detail="Usuario de Roblox no encontrado")
            
            user_id = data_id["data"][0]["id"]

           
            res_user = await client.get(
                f"https://users.roblox.com/v1/users/{user_id}",
                headers=headers,
                timeout=15
            )
            user_data = res_user.json()

            
            res_stats = await client.get(
                f"https://friends.roblox.com/v1/users/{user_id}/followers/count",
                headers=headers,
                timeout=15
            )
            stats = res_stats.json()

           
            res_avatar = await client.get(
                f"https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds={user_id}&size=420x420&format=Png&isCircular=false",
                headers=headers,
                timeout=15
            )
            avatar_data = res_avatar.json()
            avatar_url = avatar_data["data"][0]["imageUrl"] if avatar_data.get("data") else None

            return {
                "status": "ok",
                "data": {
                    "nombre": user_data.get("displayName") or username,
                    "usuario": user_data.get("name") or username,
                    "id": user_id,
                    "bio": user_data.get("description") or "Sin biografía",
                    "creado": user_data.get("created", "").split("T")[0],
                    "baneado": user_data.get("isBanned", False),
                    "seguidores": stats.get("count", 0),
                    "avatar": avatar_url
                }
            }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[X] Error en Roblox: {e}")
        raise HTTPException(status_code=500, detail=str(e))