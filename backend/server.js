const express = require('express');
const cors = require('cors');

const validarRoute = require('./routes/validar');
const documentosRoute = require('./routes/documentos');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api', validarRoute);
app.use('/api', documentosRoute);

app.listen(PORT, () => {
  console.log(`✅ Backend MRS rodando em http://localhost:${PORT}`);
});
