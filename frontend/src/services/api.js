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

export async function buscarDocumentos(cpf, tipo, ano) {
  const cpfLimpo = cpf.replace(/\D/g, '');
  const params = new URLSearchParams({ tipo });
  if (ano) params.set('ano', ano);
  const response = await fetch(`${API_BASE}/documentos/${cpfLimpo}?${params}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.mensagem || 'Erro ao buscar documentos.');
  }

  return data;
}
