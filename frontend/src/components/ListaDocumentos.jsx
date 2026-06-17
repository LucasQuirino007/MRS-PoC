import { useState } from 'react';

const LABELS = {
  IR: 'Informe de Rendimentos',
  BOLETO: 'Boletos do Plano de Saúde',
};

function formatarData(isoString) {
  const data = new Date(isoString);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatarCpf(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export default function ListaDocumentos({ colaborador, documentos, tipoDocumento, onNovaConsulta, onVoltar }) {
  const anosDisponiveis = tipoDocumento === 'IR'
    ? [...new Set(documentos.map((doc) => doc.ano).filter(Boolean))].sort((a, b) => b - a)
    : [];

  const [anoSelecionado, setAnoSelecionado] = useState('');

  const documentosFiltrados = tipoDocumento === 'IR' && anoSelecionado
    ? documentos.filter((doc) => doc.ano === Number(anoSelecionado))
    : documentos;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onVoltar}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
        <button
          onClick={onNovaConsulta}
          className="text-sm text-blue-700 hover:underline font-medium"
        >
          Nova consulta
        </button>
      </div>

      {/* Card do colaborador */}
      <div className="bg-blue-900 text-white rounded-2xl p-6 mb-6 shadow">
        <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">Colaborador identificado</p>
        <h2 className="text-xl font-bold">{colaborador?.nome}</h2>
        <p className="text-blue-200 text-sm mt-1">CPF: {formatarCpf(colaborador?.cpf || '')}</p>
        <span className="inline-block mt-3 text-xs font-medium bg-blue-800 px-3 py-1 rounded-full">
          {LABELS[tipoDocumento]}
        </span>
      </div>

      {/* Filtro por ano — somente para IR */}
      {tipoDocumento === 'IR' && anosDisponiveis.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label htmlFor="filtro-ano" className="text-sm font-medium text-slate-600 shrink-0">
            Filtrar por ano:
          </label>
          <select
            id="filtro-ano"
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="">Todos os anos</option>
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
        </div>
      )}

      {/* Lista de documentos */}
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Documentos disponíveis ({documentosFiltrados.length})
      </h3>

      {documentosFiltrados.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-700 font-medium">Documento não localizado.</p>
          <p className="text-amber-600 text-sm mt-1">
            Não há documentos do tipo selecionado para o seu CPF.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {documentosFiltrados.map((doc) => (
            <li
              key={doc.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm
                flex items-center justify-between gap-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{doc.descricao}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.nome}</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Link expira em: {formatarData(doc.expiraEm)}
                  </p>
                </div>
              </div>

              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir documento"
                className="shrink-0 flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white
                  text-sm font-medium px-4 py-2 rounded-lg transition-colors
                  focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Abrir
              </a>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-400 text-center mt-6">
        Os links são temporários e expiram em 1 hora por razões de segurança.
      </p>
    </div>
  );
}
