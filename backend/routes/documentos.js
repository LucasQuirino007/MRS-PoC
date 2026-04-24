const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const documentosPorCpf = require('../data/documentos');

// Conta de storage simulada (Azure Blob Storage)
const STORAGE_ACCOUNT = 'mrsstoragepoc';
const CONTAINER = 'documentos-colaboradores';
const BASE_URL = `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINER}`;

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
  return cpf ? cpf.replace(/\D/g, '') : '';
}

/**
 * GET /api/documentos/:cpf?tipo=IR|BOLETO&ano=2024
 * Retorna a lista de documentos disponíveis para o CPF informado, filtrado pelo tipo.
 * Para tipo IR, o parâmetro opcional "ano" filtra por ano específico.
 */
router.get('/documentos/:cpf', (req, res) => {
  const cpfLimpo = limparCpf(req.params.cpf);
  const tipo = (req.query.tipo || '').toUpperCase();
  const ano = req.query.ano ? parseInt(req.query.ano, 10) : null;

  if (!tipo || !['IR', 'BOLETO'].includes(tipo)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Parâmetro "tipo" inválido. Use IR ou BOLETO.',
    });
  }

  if (ano !== null && (isNaN(ano) || ano < 1900 || ano > 9999)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Parâmetro "ano" inválido. Informe um ano com 4 dígitos.',
    });
  }

  const registros = documentosPorCpf[cpfLimpo];

  if (!registros) {
    return res.status(404).json({
      sucesso: false,
      mensagem: 'Documento não localizado para o CPF informado.',
    });
  }

  let lista = registros[tipo];

  if (!lista || lista.length === 0) {
    return res.status(404).json({
      sucesso: false,
      mensagem: 'Documento não localizado.',
    });
  }

  if (tipo === 'IR' && ano !== null) {
    lista = lista.filter((doc) => doc.ano === ano);

    if (lista.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: `Documento não localizado para o ano ${ano}.`,
      });
    }
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

module.exports = router;
