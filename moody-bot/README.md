# Configurar APIs

Agrega al archivo `.env`, en la carpeta principal del bot, las credenciales de los servicios que quieras usar. Reinicia el bot después de guardar los cambios.

## Spotify

1. Inicia sesión en [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
2. Crea una aplicación y copia el Client ID y el Client Secret.

```env
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
```

## SearchApi.io

1. Regístrate en [SearchApi.io](https://www.searchapi.io/) y copia la API key del panel.

```env
SEARCHAPI_API_KEY=tu_api_key
```

## remove.bg

1. Regístrate en [remove.bg](https://www.remove.bg/) y crea una API key desde el panel.

```env
REMOVEBG_API_KEY=tu_api_key
```

## deAPI.ai

1. Regístrate en [deAPI.ai](https://deapi.ai/) y crea una API key desde el panel.

```env
DEAPI_KEY=tu_api_key
```

## Rule34

1. Inicia sesión en [Rule34.xxx](https://rule34.xxx/) y copia la API key y el User ID de tu cuenta.

```env
RULE34_API_KEY=tu_api_key
RULE34_USER_ID=tu_user_id
```

## Viggle y Cloudflare R2

1. Obtén una API key para [Viggle](https://viggle.ai/).
2. En [Cloudflare](https://dash.cloudflare.com/), crea un bucket R2 y un token con permisos de lectura y escritura para ese bucket.
3. Copia el Account ID, Access Key ID y Secret Access Key. Configura una URL pública para el bucket.

```env
VIGGLE_API_KEY=tu_api_key
R2_ACCOUNT_ID=tu_account_id
R2_ACCESS_KEY_ID=tu_access_key_id
R2_SECRET_ACCESS_KEY=tu_secret_access_key
R2_BUCKET_NAME=nombre_de_tu_bucket
R2_PUBLIC_URL=https://tu-dominio-publico
```

## TikTok Stalk

El comando `.tiktokstalk <usuario>` (alias `.ttstalk`, `.tstalk`) no usa una API externa: consulta el servidor local `tiktok_scraper_api.py` en `http://127.0.0.1:8008`, así que debe ejecutarse en el mismo equipo que el bot.

1. Instala las dependencias de Python:

```powershell
cd C:\moody\moody-bot
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install fastapi uvicorn scrapling
scrapling install
```

2. Arranca el servidor en otra terminal y déjalo corriendo:

```powershell
cd C:\moody\moody-bot
python -m uvicorn tiktok_scraper_api:app --host 127.0.0.1 --port 8008
```

3. Verifica la respuesta:

```powershell
curl http://127.0.0.1:8008/stalk/tiktok
```

El puerto está fijo en `handlers/commands/stalk/tiktokstalk.js`; si lo cambias, actualiza la URL ahí. En Node solo se necesita `axios`, ya incluido en `package.json`.

## Menú de comandos

El menú se envía en un solo mensaje de texto con una miniatura local en la tarjeta `externalAdReply`. La imagen configurada es `media/menu1.jpg`; si no se puede leer, el bot registra el error y envía el texto sin miniatura. El texto incluye el separador para «Leer más».

El bot registra en consola el acuse de WhatsApp de cada menú (`[MENU] Estado del mensaje ...`), por ejemplo `aceptado por el servidor`, `entregado a <número>`, `leído por <número>`, `ERROR (rechazado por WhatsApp)` o `sin acuse aún`.

## Procesamiento de mensajes y metadatos de grupos

- Los mensajes enviados por el propio bot no se procesan como comandos.
- Los `protocolMessage` (por ejemplo, ciertos acuses o eventos del protocolo) se omiten porque no contienen texto de comando.
- Los metadatos de grupo se guardan en memoria por 60 segundos y las solicitudes simultáneas al mismo grupo comparten la misma consulta. Los cambios de participantes o del grupo invalidan la entrada correspondiente. Si WhatsApp rechaza una consulta, el error se registra; no se oculta con un `catch` vacío.
- El logger Pino de Baileys no se fuerza a nivel `silent`. Algunos mensajes como `Closing session` los emite `libsignal` directamente con `console.info`, no a través de Pino.

## Instalar programas externos en Windows

Sin estos programas, los comandos que dependen de ellos no funcionarán. Instálalos en el mismo equipo donde se ejecuta el bot. Necesitas Python para instalar las herramientas de descarga:

```powershell
py --version
py -m pip install -U yt-dlp gallery-dl spotdl
```

Instala FFmpeg con **winget**:

```powershell
winget install --id Gyan.FFmpeg.Shared --exact
```

Cierra y vuelve a abrir PowerShell. Verifica que los programas estén disponibles:

```powershell
yt-dlp --version
gallery-dl --version
spotdl --version
ffmpeg -version
```

Si un comando no se reconoce, revisa que Python y FFmpeg estén agregados al `PATH`.

## Cookies para descargas

Algunos sitios limitan las descargas automatizadas. El bot puede usar cookies exportadas de una sesión iniciada en el navegador para acceder a contenido que requiere autenticación o para ayudar a descargar publicaciones que las herramientas no pueden obtener sin ellas. No son las cookies de la sesión de WhatsApp del bot.

Guarda los archivos exportados en formato Netscape en estas rutas:

```text
C:\moody\cookies\instagram-cookies.txt
C:\moody\cookies\pinterest-cookies.txt
C:\moody\cookies\tiktok-cookies.txt
```

Puedes crear la carpeta desde PowerShell con:

```powershell
New-Item -ItemType Directory -Force C:\moody\cookies
```

- **Instagram:** se usan como alternativa con `gallery-dl` cuando la descarga normal no obtiene los archivos, por ejemplo, en algunos carruseles.
- **Pinterest:** se usan para leer los datos del pin y también en la descarga alternativa con `gallery-dl`.
- **TikTok:** se usan en `gallery-dl` para publicaciones de fotos; los videos se intentan descargar con `yt-dlp`.

Exporta las cookies del sitio correspondiente desde un navegador donde hayas iniciado sesión. Son credenciales temporales de tu cuenta: no las compartas, no las publiques ni las subas al repositorio. Pueden caducar; si dejan de funcionar, expórtalas de nuevo. Sin cookies, algunas descargas públicas pueden seguir funcionando, pero el contenido privado o restringido puede fallar.

## Instalar el bot en Windows

1. Instala [Node.js LTS](https://nodejs.org/) y [Git](https://git-scm.com/download/win).
2. Abre PowerShell y ejecuta:

```powershell
New-Item -ItemType Directory -Force C:\moody | Out-Null
cd C:\moody
git clone https://github.com/darlyn1234/moody-bot.git
cd moody-bot
npm install
```

3. Crea `.env` desde la plantilla solo si todavía no tienes ese archivo:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

4. Completa en `.env` las credenciales de las APIs que quieras usar.
5. Inicia el bot directamente para la primera configuración:

```powershell
npm start
```

6. Escanea con WhatsApp el código QR que aparece en la consola: **Dispositivos vinculados > Vincular un dispositivo**. Conserva la carpeta `auth`; guarda la sesión y evita volver a vincular el bot en cada inicio...

## Recuperación de conexión de WhatsApp

Baileys no vuelve a conectar el socket por sí solo cuando se cierra. El bot gestiona los cierres desde `connection.update`:

1. Ante un cierre recuperable, vuelve a iniciar el socket con espera exponencial: 5, 10, 20, 40 y hasta 60 segundos entre intentos.
2. Cuando la conexión se abre, reinicia el contador de intentos.
3. Si Baileys informa que la sesión no es válida (`badSession`) o se cerró (`loggedOut`), el proceso termina. Si usas PM2, deténlo primero para evitar reinicios repetidos. Revisa la ruta indicada por `SESSION_NAME` en `utils/config.json` (por defecto `auth/main`); conserva una copia y renombra la sesión anterior para que Baileys pueda mostrar un QR nuevo. Después, vuelve a vincular el dispositivo y arranca el bot.
4. Si la conexión fue reemplazada (`connectionReplaced`), detén el proceso supervisado, cierra la otra instancia o sesión y después vuelve a arrancarlo.

El bot **no borra automáticamente** la carpeta de autenticación; así se evita perder credenciales por un fallo transitorio.

## Recuperación selectiva de errores de descifrado

Baileys puede emitir un mensaje de tipo `CIPHERTEXT` cuando no consigue descifrarlo. El bot aplica una limpieza acotada para algunos errores de Signal:

1. Solo considera mensajes directos entrantes con errores `Bad MAC`, `No Session`, `Invalid PreKey` o `Invalid Session`. No cuenta grupos, estados ni mensajes enviados por el propio bot.
2. Cuenta mensajes con identificadores distintos del mismo remitente durante una ventana de 60 segundos; un mismo mensaje no suma más de una vez.
3. Al llegar a 3 fallos, elimina únicamente la sesión Signal de ese remitente mediante `signalRepository.deleteSession`. Baileys puede crear una sesión nueva cuando sea necesario.
4. Si llega un mensaje directo que se descifra correctamente, el contador de ese remitente se reinicia. Si la eliminación falla, el error queda registrado en la consola.

La limpieza elimina solo la sesión Signal correspondiente mediante la API de Baileys; no borra manualmente archivos ni la carpeta completa de autenticación. Tampoco reemplaza los reintentos de mensajes que realiza Baileys.

## Supervisión y reinicio del proceso con PM2

La reconexión anterior recupera el socket mientras Node.js sigue funcionando. PM2 supervisa el proceso y lo reinicia si Node.js termina inesperadamente.

1. Instala PM2 globalmente (una vez):

```powershell
npm install --global pm2
```

2. Desde la carpeta del proyecto, inicia el bot bajo PM2:

```powershell
cd C:\moody\moody-bot
npm run start:pm2
```

El archivo [ecosystem.config.cjs](./ecosystem.config.cjs) habilita el reinicio automático con una espera de 5 segundos y desactiva el modo `watch`. No ejecutes a la vez `npm start` y el proceso de PM2: serían dos instancias del bot y podrían reemplazarse entre sí.

3. Comprueba el estado y consulta los registros:

```powershell
pm2 status
pm2 logs moody-bot
```

4. Para reiniciar o detener el bot:

```powershell
pm2 restart moody-bot
pm2 stop moody-bot
```

PM2 reinicia también una salida provocada por `badSession` o `loggedOut`; si esto ocurre, detén el proceso con `pm2 stop moody-bot`, vuelve a vincular WhatsApp según el paso anterior y arráncalo de nuevo con `npm run start:pm2`. PM2 debe estar instalado y su daemon activo para supervisar el bot. Estos pasos no configuran el inicio automático de PM2 después de reiniciar Windows.
