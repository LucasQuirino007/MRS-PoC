const express = require('express');
const cors = require('cors');

const validarRoute = require('./routes/validar');
const documentosRoute = require('./routes/documentos');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10kb' })); // 🛡️ FIX: limite de tamanho do body previne payload attacks

app.use('/api', validarRoute);
app.use('/api', documentosRoute);

// 🛡️ FIX: global error handler — captura exceções não tratadas nas rotas,
// evita stack trace exposto e retorna resposta JSON padronizada
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERRO INTERNO]', err.message);
  res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`✅ Backend MRS rodando em http://localhost:${PORT}`);
});
