// api/process.js - Vercel Serverless Function
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { text } = req.body;

    if (!text || text.trim().length < 10) {
      return res.status(400).json({ error: 'Texto inválido o muy corto' });
    }

    // Procesar con OpenAI
    const result = await procesarConOpenAI(text);
    
    if (!result) {
      return res.status(500).json({ error: 'Error al procesar con IA' });
    }

    res.status(200).json(result);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}

async function procesarConOpenAI(texto) {
  const prompt = `Eres un extractor experto de datos de citaciones médicas argentinas.

TEXTO A PROCESAR:
${texto}

INSTRUCCIONES:
1. Ignora timestamps de WhatsApp [HH:MM, DD/MM/AAAA] y conversaciones entre empleados
2. Extrae solo citaciones médicas reales con datos válidos
3. Nombres: formato "NOMBRE APELLIDO" (si viene "APELLIDO, NOMBRE" → convertir)
4. Fechas: DD/MM/AAAA (si falta año, usar 2025)
5. Horas: HH:MM formato 24h
6. Tipos: ADH (Audiencia Homologación), AM (Audiencia Médica), VDD (Valoración Daño)
7. Elimina texto legal innecesario como "La presente citación se realiza conforme..."

CONTRAPARTES CONOCIDAS (usar nombres completos):
- PROVINCIA ART S.A.
- SWISS MEDICAL ART S.A.
- ASOCIART ART S.A.
- GALENO ART S.A.
- LA SEGUNDA ART S.A.

DEVUELVE UN JSON VÁLIDO CON ESTE FORMATO EXACTO:
{
  "citaciones": [
    {
      "expediente": "123456/25",
      "nombre": "Juan Carlos Pérez",
      "cuil": "20123456789",
      "fecha": "15/08/2025",
      "hora": "10:30",
      "direccion": "Salta 2602",
      "ciudad": "Rosario",
      "tipo": "AM",
      "motivo": "Divergencia en la Determinación de la Incapacidad",
      "art": "PROVINCIA ART S.A.",
      "patologia": "",
      "linkVirtual": ""
    }
  ]
}

IMPORTANTE: 
- Responde SOLO con el JSON válido, sin texto adicional
- Si no encuentras citaciones válidas, devuelve: {"citaciones": []}
- Asegúrate de que el JSON sea parseable`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.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}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un extractor experto de datos médicos. Respondes ÚNICAMENTE con JSON válido, sin explicaciones adicionales."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error('OpenAI API Error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Respuesta inválida de OpenAI:', data);
      return null;
    }
    
    const textoRespuesta = data.choices[0].message.content.trim();
    
    // Limpiar respuesta y parsear JSON
    let jsonText = textoRespuesta;
    
    // Remover markdown si existe
    jsonText = jsonText.replace(/```json\n?|\n?```/g, '');
    
    // Remover texto antes y después del JSON
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    }
    
    const result = JSON.parse(jsonText);
    
    // Validar estructura
    if (!result.citaciones || !Array.isArray(result.citaciones)) {
      console.error('Estructura JSON inválida:', result);
      return { citaciones: [] };
    }
    
    return result;
    
  } catch (error) {
    console.error('Error procesando con OpenAI:', error);
    return null;
  }
}
