const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const documentosPorCpf = require('../data/documentos');

// Conta de storage simulada (Azure Blob Storage)
const STORAGE_ACCOUNT = 'mrsstoragepoc';
const CONTAINER = 'documentos-colaboradores';
const BASE_URL = `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINER}`;

// Armazenamento em memória para uploads simulados
const uploadsPorCpf = {};
const MAX_UPLOADS_POR_CPF = 50; // 🛡️ FIX: limite de segurança para evitar crescimento ilimitado da memória

// Gera um link com SAS token simulado (UUID + expiração de 1 hora)
function gerarSasUrl(path, arquivo) {
  const token = uuidv4().replace(/-/g, '');
  const agora = new Date();
  const expiracao = new Date(agora.getTime() + 60 * 60 * 1000); // +1 hora

  const sv = '2024-08-04';
  const se = expiracao.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const sp = 'r';
  const sig = token;

  const url = `${BASE_URL}/${path}/${arquivo}?sv=${sv}&se=${encodeURIComponent(se)}&sp=${sp}&sig=${sig}`;

  return { url, expiraEm: expiracao.toISOString() };
}

function limparCpf(cpf) {
  // 🛡️ FIX: type-safe — impede TypeError se cpf for objeto/array no body JSON
  if (typeof cpf !== 'string') return '';
  return cpf.replace(/\D/g, '');
}

/**
 * GET /api/documentos/:cpf?tipo=IR|BOLETO
 * Retorna a lista de documentos disponíveis para o CPF informado, filtrado pelo tipo.
 */
router.get('/documentos/:cpf', (req, res) => {
  const cpfLimpo = limparCpf(req.params.cpf);
  const tipo = (req.query.tipo || '').toUpperCase();

  if (!tipo || !['IR', 'BOLETO'].includes(tipo)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Parâmetro "tipo" inválido. Use IR ou BOLETO.',
    });
  }

  const registros = documentosPorCpf[cpfLimpo];

  if (!registros) {
    return res.status(404).json({
      sucesso: false,
      mensagem: 'Documento não localizado para o CPF informado.',
    });
  }

  const lista = registros[tipo];

  if (!lista || lista.length === 0) {
    return res.status(404).json({
      sucesso: false,
      mensagem: 'Documento não localizado.',
    });
  }

  const documentos = lista.map((doc) => {
    const { url, expiraEm } = gerarSasUrl(doc.path, doc.arquivo);

    const descricao =
      tipo === 'IR'
        ? `Informe de Rendimentos ${doc.ano}`
        : `Boleto Plano de Saúde — ${doc.mes}/${doc.ano}`;

    return {
      id: uuidv4(),
      nome: doc.arquivo,
      descricao,
      tipo,
      url,
      expiraEm,
    };
  });

  return res.json({ sucesso: true, documentos });
});

/**
 * POST /api/documentos/upload
 * Body: { cpf, mes, ano }
 * Simula o upload de um novo boleto para o colaborador informado.
 * O arquivo é registrado em memória e uma URL com SAS token simulado é retornada.
 */
router.post('/documentos/upload', (req, res) => {
  const { cpf, mes, ano } = req.body;

  if (!cpf || !mes || !ano) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Os campos "cpf", "mes" e "ano" são obrigatórios.',
    });
  }

  const cpfLimpo = limparCpf(cpf);

  if (!/^\d{11}$/.test(cpfLimpo)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'CPF inválido. Informe um CPF com 11 dígitos numéricos.',
    });
  }

  // 🛡️ FIX: validação de tipo — mes e ano devem ser string ou number (rejeita objetos/arrays)
  if (!['string', 'number'].includes(typeof mes) || !['string', 'number'].includes(typeof ano)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Os campos "mes" e "ano" devem ser valores numéricos.',
    });
  }

  const mesStr = String(mes).padStart(2, '0');
  const anoStr = String(ano);

  if (!/^\d{2}$/.test(mesStr) || Number(mesStr) < 1 || Number(mesStr) > 12) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Mês inválido. Informe um valor entre 01 e 12.',
    });
  }

  if (!/^\d{4}$/.test(anoStr)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Ano inválido. Informe um ano com 4 dígitos.',
    });
  }

  // 🛡️ FIX: validação de intervalo razoável — impede anos absurdos como 0001 ou 9999
  if (Number(anoStr) < 2000 || Number(anoStr) > 2100) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Ano inválido. Informe um ano entre 2000 e 2100.',
    });
  }

  const nomeArquivo = `BLT_${mesStr}_${anoStr}_${cpfLimpo}.pdf`;
  // 🛡️ FIX: renomeado de `path` para `blobPath` — evita shadowing do módulo built-in path do Node.js
  const blobPath = `BOLETOS/${anoStr}/${mesStr}`;

  // Registra o documento na memória (simulação de persistência)
  if (!uploadsPorCpf[cpfLimpo]) {
    uploadsPorCpf[cpfLimpo] = [];
  }

  // 🛡️ FIX: prevenção de duplicatas — rejeita upload do mesmo CPF/mês/ano
  const jaExiste = uploadsPorCpf[cpfLimpo].some(
    (u) => u.mes === mesStr && u.ano === Number(anoStr)
  );
  if (jaExiste) {
    return res.status(409).json({
      sucesso: false,
      mensagem: 'Já existe um boleto registrado para este CPF, mês e ano.',
    });
  }

  // 🛡️ FIX: limite de uploads por CPF para conter crescimento ilimitado da memória
  if (uploadsPorCpf[cpfLimpo].length >= MAX_UPLOADS_POR_CPF) {
    return res.status(429).json({
      sucesso: false,
      mensagem: 'Limite de uploads atingido para este CPF.',
    });
  }

  uploadsPorCpf[cpfLimpo].push({ mes: mesStr, ano: Number(anoStr), arquivo: nomeArquivo, blobPath });

  const { url, expiraEm } = gerarSasUrl(blobPath, nomeArquivo);

  return res.status(201).json({
    sucesso: true,
    mensagem: 'Boleto enviado com sucesso.',
    documento: {
      id: uuidv4(),
      nome: nomeArquivo,
      descricao: `Boleto Plano de Saúde — ${mesStr}/${anoStr}`,
      tipo: 'BOLETO',
      url,
      expiraEm,
    },
  });
});

module.exports = router;
