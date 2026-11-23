const axios = require('axios');

async function registrar() {
    try {
        console.log("Registrando aplicación en FreeAPITools...");
        
        const regRes = await axios.post("https://freeapitools.dev/api/v1/register", {
            app_name: "moody-bot",
            platform: "node"
        });
        
        const apiKey = regRes.data.api_key;
        console.log("✅ API Key obtenida:", apiKey);

        console.log("Activando clave...");
        await axios.post("https://freeapitools.dev/api/v1/activate", {
            api_key: apiKey,
            cliente: {
                nombre: "moody-bot",
                tipo: "cli",
                versión: "1.0.0",
                "tiempo de ejecución": "node 22"
            }
        });
        
        console.log("✅ Clave activada correctamente.");
        console.log("Copia esta clave en tu comando hd.js:", apiKey);

    } catch (error) {
        console.error("❌ Error:", error.response?.data || error.message);
    }
}

registrar();