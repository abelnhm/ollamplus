// Please install OpenAI SDK first: `npm install openai`

import OpenAI from "openai";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const checkErrors = (error) => {
  switch (error.status) {
    case 400:
      console.error("❌ Error en la solicitud:", error.message);
      break;
    case 401:
      console.error("❌ Error de autenticación:", error.message);
      break;
    case 402:
      console.log("⚠️ Saldo insuficiente, pero la integración funciona");
      break;
    case 422:
      console.error("❌ Error de validación:", error.message);
      break;
    case 429:
      console.log(
        "❌ Se excedió el límite de solicitudes por minuto para tu cuenta",
        error.message,
      );
      break;
    case 500:
      console.error("❌ Error interno del servidor:", error.message);
      break;
    case 503:
      console.error("❌ Servicio no disponible:", error.message);
      break;
    default:
      console.error("❌ Error en la integración:", error.message);
      break;
  }
};

async function main() {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "You are a helpful assistant." }],
      model: "deepseek-chat",
    });

    console.log(completion.choices[0].message.content);
  } catch (error) {
    checkErrors(error);
  }
}

main();
