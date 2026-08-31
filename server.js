// server.js - CACA BRAIN ULTRA v2.0
// Servidor para desarrollo local y Netlify

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3400;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================
// SERVIDOR DE ARCHIVOS ESTÁTICOS CON MIME TYPES
// ============================================
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    } else if (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.ico')) {
      res.setHeader('Content-Type', `image/${path.extname(filePath).substring(1)}`);
    }
  }
}));

// ============================================
// RUTA ESPECÍFICA PARA SEED.JSON
// ============================================
app.get('/data/seed.json', (req, res) => {
  const filePath = path.join(__dirname, 'data/seed.json');
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(filePath);
  } else {
    // Si no existe seed.json, devolver un objeto vacío
    res.status(404).json({
      error: 'Seed file not found',
      message: 'Crea un archivo data/seed.json con los datos iniciales'
    });
  }
});

// ============================================
// RUTA PARA ARCHIVOS JS DE MÓDULOS
// ============================================
app.get('/js/modules/*.js', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Archivo no encontrado');
  }
});

app.get('/js/*.js', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Archivo no encontrado');
  }
});

// ============================================
// API ENDPOINTS
// ============================================

// Registro
app.post('/api/register', (req, res) => {
  // El registro se maneja en el frontend con IndexedDB
  res.json({ success: true, message: 'Registro exitoso' });
});

// Estadísticas
app.get('/api/stats/:userId', (req, res) => {
  // Las estadísticas se manejan en el frontend
  res.json({ success: true, data: {} });
});

// GROQ API Proxy (para no exponer la API key)
app.post('/api/groq-message', async (req, res) => {
  const { apiKey, prompt } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API Key requerida' });
  }
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt requerido' });
  }
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'Eres CACA COMPA, un asistente absurdo y gamer. Hablas en "idioma P" (cada sílaba + p + vocal). Responde con energía, memes y jerga gamer. Sé positivo y motivador. Respuestas cortas (máximo 2 frases).'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.9
      })
    });
    
    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json({ message: data.choices[0].message.content });
  } catch (error) {
    console.error('Groq error:', error);
    res.status(500).json({ error: 'Error con Groq API: ' + error.message });
  }
});

// ============================================
// RUTA PRINCIPAL
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// MANEJO DE RUTAS NO ENCONTRADAS
// ============================================
app.use((req, res) => {
  // Si es un archivo JS, devolver con MIME correcto
  if (req.path.endsWith('.js')) {
    const filePath = path.join(__dirname, req.path);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/javascript');
      return res.sendFile(filePath);
    }
  }
  
  // Si no, devolver index.html (SPA)
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log('========================================');
  console.log('💩 CACA BRAIN ULTRA v2.0');
  console.log('========================================');
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🎮 ¡El absurdo te espera!`);
  console.log('========================================');
  
  // Verificar si existe seed.json
  const seedPath = path.join(__dirname, 'data/seed.json');
  if (fs.existsSync(seedPath)) {
    console.log('✅ Seed file encontrado: data/seed.json');
  } else {
    console.log('⚠️ Seed file no encontrado: data/seed.json');
    console.log('   Crea el archivo con los datos iniciales');
  }
  console.log('========================================');
});