<p align="center">
  <a href="https://github.com/whymoody">
    <img align="center" src="https://cardgit-six.vercel.app/api?name=Moody%20Bot%20🌵&description=Repositorio%20oficial%20de%20Moody%20Bot&image=https://i.pinimg.com/564x/a8/c2/5f/a8c25faed580a057f1e52ec1e68e50e0.jpg&usqp=CAU&backgroundColor=%23ecf0f1&instagram=delirius0&github=darlyn1234&pattern=ticTacToe&colorPattern=%23eaeaea&site=" />
  </a>
</p>

<h3><strong>Bienvenido al repositorio de Moody Bot, este es una base hecha desde 0 con una base de datos en SQL, las actualizaciones se haran constantemente y me comprometo con darle mantenimiento constantemente y asi evitar errores en los comandos.</strong></h3>

## Nota: README.md en creacion xd

### `Instalacion y ejecucion`

- **Ejemplo:**
```shell
apt install git
apt install nodejs
apt install ffmpeg
git clone https://github.com/darlyn1234/moody-bot
cd moody-bot
npm install
npm start
```

### `Cambiar Owner y otros datos`

- **Cambiar Owner:** <a href="https://github.com/darlyn1234">click aqui</a>
- **Nombre:** <a href="https://github.com/darlyn1234">click aqui</a>

### `Agregar imágenes al comando boobs`

Agrega tus imágenes en `media/boobs`. El comando elige una imagen al azar cada vez que se usa. Se admiten archivos `.jpg`, `.jpeg`, `.png` y `.webp`.

### `Agregar imágenes al comando penes`

Agrega tus imágenes en `media/penes`. El comando `.penes` elige una imagen al azar cada vez que se usa y la envía como imagen de una sola vista. Se admiten archivos `.jpg`, `.jpeg`, `.png` y `.webp`.

### `Buscar canciones en Spotify`

El comando `.spotify` busca canciones y devuelve hasta cinco resultados con título, artista, álbum, duración y enlace oficial. Después de una búsqueda puedes elegir un resultado con `.spotify <número>`, por ejemplo `.spotify 2`; la selección caduca a los 5 minutos. También acepta enlaces de canción, álbum o lista de reproducción: para álbumes y listas muestra sus primeras canciones y permite elegirlas de la misma forma.
El alias `.spotifydl` responde que no es posible descargar la canción como archivo de audio mediante la API oficial. Ninguno de los comandos envía archivos de audio.

1. Crea una aplicación en el [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Copia el **Client ID** y el **Client Secret** de la aplicación.
3. En la carpeta del proyecto, crea un archivo `.env` a partir de `.env.example` y coloca ahí el Client ID y el Client Secret. Alternativamente, puedes definirlos en el entorno donde inicias el bot. En PowerShell:

```env
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
```

Luego inicia el bot desde la carpeta del proyecto:

```powershell
cd C:\moody\moody-bot
npm start
```

El bot carga automáticamente el archivo `.env` al iniciar. Si ejecutas el bot en un hosting, define las variables en la configuración de entorno de ese servicio. No compartas ni publiques el Client Secret. El comando acepta una búsqueda, por ejemplo `.spotify Feel Special`, o un enlace de canción, álbum o lista de reproducción de Spotify.

### `Enviar audio propio`

El comando `.audio` envía archivos de audio que tú tengas derecho a distribuir. Coloca los archivos en `media/audio`; se admiten `.mp3`, `.m4a`, `.aac`, `.ogg` y `.opus`.

- `.audio` o `.audio lista` muestra los archivos disponibles.
- `.audio nombre` envía el archivo que coincida con ese nombre. Si hay varias coincidencias, el bot muestra las opciones para que seas más específico.

El límite de audio en WhatsApp es de 16 MB. El bot no descarga audio de Spotify ni de otras plataformas.

### `Etiquetar a todos en el grupo`

`.totag` menciona a todos los participantes del grupo y excluye al propio bot. Solo puede usarlo un administrador. Opcionalmente acepta un mensaje que se muestra antes de las menciones, por ejemplo `.totag Reunión a las 8`.

### `Buscar información en Google`

El comando `.google` muestra una respuesta destacada cuando está disponible y hasta cinco resultados de Google con título, resumen y enlace. La búsqueda se realiza mediante [SearchApi.io](https://www.searchapi.io/docs/google), un proveedor externo de resultados de Google.

1. Crea una cuenta en [SearchApi.io](https://www.searchapi.io/) y copia tu API key desde el panel.
2. Añade `SEARCHAPI_API_KEY=tu_api_key` al archivo `.env` en la carpeta del proyecto. Puedes copiar `.env.example` como base.
3. Reinicia el bot para que cargue la variable.

No compartas ni publiques la API key. SearchApi.io aplica sus propias cuotas y condiciones de uso.

### `Buscar en Wikipedia`

Usa `.wikipedia tema` o `.wiki tema` para buscar hasta tres artículos de Wikipedia en español y recibir sus resúmenes con enlaces. No requiere API key.

### `Buscar videos en YouTube`

Usa `.ytsearch tema` (o `.yts tema`) para buscar hasta cinco videos de YouTube. Cada resultado muestra el título, el canal, la duración, las vistas y el enlace. Para descargar un video de la lista, copia su enlace y usa `.ytdl <enlace>`.

La búsqueda no requiere API key, pero sí `yt-dlp` instalado en el servidor (el mismo requisito que el comando `.ytdl`). Instálalo con:

```shell
pip install -U yt-dlp
```

Ten en cuenta las condiciones de uso de YouTube y descarga solo contenido que tengas derecho a usar.

### `Stalk de perfil de TikTok`

Usa `.tiktokstalk <usuario>` (alias `.ttstalk` y `.tstalk`) para obtener nombre, usuario, seguidores, seguidos, total de likes, biografía y avatar de un perfil público de TikTok. Ejemplo: `.tiktokstalk tiktok`.

Este comando **no usa una API externa**: consulta un servidor local de scraping (`tiktok_scraper_api.py`) que debe estar encendido en `http://127.0.0.1:8008`, en el mismo equipo donde corre el bot.

1. Instala [Python 3.10 o superior](https://www.python.org/downloads/) y las dependencias del servidor. Desde la carpeta del proyecto:

```powershell
cd C:\moody\moody-bot
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install fastapi uvicorn scrapling
scrapling install
```

El comando `scrapling install` descarga el navegador que usa `StealthyFetcher`; sin él el scraping falla.

2. Arranca el servidor y déjalo corriendo (en otra terminal) cada vez que vayas a usar el comando:

```powershell
cd C:\moody\moody-bot
python -m uvicorn tiktok_scraper_api:app --host 127.0.0.1 --port 8008
```

3. Comprueba que responde antes de probar el comando:

```powershell
curl http://127.0.0.1:8008/stalk/tiktok
```

En el lado de Node no hay que instalar nada extra: el comando solo usa `axios`, que ya viene en `package.json`.

Notas:

- El puerto **8008** está fijo en el comando. Si lo cambias, actualiza también la URL en `handlers/commands/stalk/tiktokstalk.js`.
- `El servidor de scraping (Python) está apagado` → el servidor no está en ejecución.
- `Perfil no encontrado o cuenta privada` → el usuario no existe o su cuenta es privada.
- Errores de Scrapling o `500` → TikTok cambió el HTML, apareció un captcha o falta el navegador de Scrapling.
- Cada consulta puede tardar: el bot espera como máximo 60 segundos.

### `Quitar el fondo de stickers`

La variante `.sticker --nobg` (también `.s --nobg`) requiere una API key de [remove.bg](https://www.remove.bg/api). Crea una clave en el panel de remove.bg y configúrala como `REMOVEBG_API_KEY` en el archivo `.env` de la carpeta del proyecto:

```env
REMOVEBG_API_KEY=tu_api_key
```

Reinicia el bot después de agregar la clave. Sin ella, remove.bg no puede procesar la variante `--nobg`. No compartas ni publiques la API key.

### `Reto y Pokédex Pokémon`

En un grupo con los minijuegos activados, usa `.pokemon` para iniciar el reto; la imagen incluye pistas de categoría, tipo, color, hábitat, generación, altura y peso. Quien adivine primero tendrá 60 segundos para usar `.pokebola` y guardar el Pokémon. Usa `.pokedex` para ver la colección; `.pokedex 2` muestra otra página. Las capturas se guardan en `db/pokedex.json`.

### `Cartas coleccionables Pokémon`

`.pokecard` busca en todo el catálogo disponible de Pokémon TCG API y elige al azar una carta existente entre las distintas expansiones y generaciones; envía la imagen original de esa carta. La API y el catálogo de imágenes son servicios de terceros, no oficiales ni afiliado con The Pokémon Company. Para obtener una clave gratuita y mejores límites, consulta el [portal para desarrolladores de Pokémon TCG API](https://dev.pokemontcg.io/) y configura `POKEMON_TCG_API_KEY` en el entorno del bot...

### `Viggle` 
.....