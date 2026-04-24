const API_BASE = '/api';

export async function validarColaborador(dados) {
  const response = await fetch(`${API_BASE}/validar-colaborador`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.mensagem || 'Erro ao validar colaborador.');
  }

  return data;
}

export async function buscarDocumentos(cpf, tipo) {
  const cpfLimpo = cpf.replace(/\D/g, '');
  const response = await fetch(`${API_BASE}/documentos/${cpfLimpo}?tipo=${tipo}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.mensagem || 'Erro ao buscar documentos.');
  }

  return data;
}
