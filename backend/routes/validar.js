const express = require('express');
const router = express.Router();
const colaboradores = require('../data/colaboradores');

// Remove formatação do CPF (pontos e traço)
function limparCpf(cpf) {
  return cpf ? cpf.replace(/\D/g, '') : '';
}

/**
 * POST /api/validar-colaborador
 * Body: { matricula, cpf, dataNascimento, dataAdmissao }
 * Valida o colaborador contra os dados mockados.
 */
router.post('/validar-colaborador', (req, res) => {
  const { matricula, cpf, dataNascimento, dataAdmissao } = req.body;

  if (!matricula || !cpf || !dataNascimento || !dataAdmissao) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Todos os campos são obrigatórios.',
    });
  }

  const cpfLimpo = limparCpf(cpf);

  const colaborador = colaboradores.find(
    (c) =>
      c.matricula === matricula.trim() &&
      c.cpf === cpfLimpo &&
      c.dataNascimento === dataNascimento &&
      c.dataAdmissao === dataAdmissao
  );

  if (!colaborador) {
    return res.status(404).json({
      sucesso: false,
      mensagem: 'Pessoa não localizada. Verifique os dados informados.',
    });
  }

  return res.json({
    sucesso: true,
    colaborador: {
      nome: colaborador.nome,
      cpf: colaborador.cpf,
      matricula: colaborador.matricula,
    },
  });
});

module.exports = router;
