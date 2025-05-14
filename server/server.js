const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const port = 3000;

// Twilio credentials
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Almacén temporal en memoria para los códigos
const codigosVerificacion = {};

app.use(cors());
app.use(bodyParser.json());

// Servir carpeta public
app.use(express.static(path.join(__dirname, '../public')));

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta para enviar código por SMS
app.post('/enviar-codigo', async (req, res) => {
  const { nombre, telefono } = req.body;

  if (!nombre || !telefono) {
    return res.status(400).json({ success: false, error: 'Faltan datos' });
  }

  // Generar código de 6 dígitos
  const codigo = Math.floor(100000 + Math.random() * 900000);

  try {
    await client.messages.create({
      body: `Tu código de acceso a NERVIO × CRUZ DEL SUR es: ${codigo}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: telefono
    });

    // Guardar el código en memoria asociado al teléfono
    codigosVerificacion[telefono] = codigo;

    console.log(`📩 SMS enviado a ${telefono}: ${codigo}`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error al enviar SMS:', error.message);
    res.status(500).json({ success: false, error: 'Error al enviar SMS' });
  }
});

// Ruta para verificar el código (opcional, si quieres validarlo después)
app.post('/verificar-codigo', (req, res) => {
  const { telefono, codigoIngresado } = req.body;

  if (codigosVerificacion[telefono] && codigosVerificacion[telefono].toString() === codigoIngresado) {
    return res.json({ success: true, mensaje: 'Código correcto' });
  } else {
    return res.json({ success: false, error: 'Código incorrecto' });
  }
});

app.listen(port, () => {
  console.log(`✅ Servidor escuchando en http://192.168.1.52:${port}`);
});
