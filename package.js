// api/process.js - VERSION DE PRUEBA SIMPLE
export default async function handler(req, res) {
  console.log('Función iniciada, método:', req.method);
  
  try {
    // CORS headers - PRIMERO SIEMPRE
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    console.log('Headers CORS configurados');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Respondiendo a preflight OPTIONS');
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
      console.log('Método no permitido:', req.method);
      return res.status(405).json({ error: 'Método no permitido' });
    }

    console.log('Método POST válido, procesando...');
    
    // Verificar si tenemos la variable de entorno
    if (!process.env.OPENAI_API_KEY) {
      console.error('ERROR: OPENAI_API_KEY no está configurada');
      return res.status(500).json({ error: 'Variable de entorno faltante' });
    }
    
    console.log('Variable OPENAI_API_KEY encontrada');

    // Respuesta simple para probar CORS
    const testResponse = {
      citaciones: [{
        expediente: "TEST123/25",
        nombre: "Juan Carlos Pérez",
        cuil: "20123456789",
        fecha: "15/08/2025",
        hora: "10:30",
        direccion: "Salta 2602",
        ciudad: "Rosario",
        tipo: "AM",
        motivo: "Test de CORS exitoso",
        art: "TEST ART",
        patologia: "",
        linkVirtual: ""
      }]
    };

    console.log('Enviando respuesta de prueba...');
    return res.status(200).json(testResponse);
    
  } catch (error) {
    console.error('ERROR en función:', error);
    // Asegurar headers CORS incluso en error
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Error interno: ' + error.message });
  }
}
