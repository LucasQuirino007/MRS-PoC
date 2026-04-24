import { useState } from 'react';
import { validarColaborador, buscarDocumentos } from '../services/api';

const LABELS = {
  IR: 'Informe de Rendimentos',
  BOLETO: 'Boletos do Plano de Saúde',
};

function aplicarMascaraCpf(valor) {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);
  return numeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function FormularioValidacao({ tipoDocumento, onSucesso, onVoltar }) {
  const [form, setForm] = useState({
    matricula: '',
    cpf: '',
    dataNascimento: '',
    dataAdmissao: '',
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === 'cpf') {
      setForm((prev) => ({ ...prev, cpf: aplicarMascaraCpf(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const { colaborador } = await validarColaborador(form);
      const { documentos } = await buscarDocumentos(form.cpf, tipoDocumento);
      onSucesso(colaborador, documentos);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <button
          onClick={onVoltar}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Identificação do Colaborador</h2>
          <p className="text-slate-500 text-sm mt-1">
            Preencha seus dados para acessar os{' '}
            <span className="font-medium text-blue-700">{LABELS[tipoDocumento]}</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="matricula">
              Matrícula
            </label>
            <input
              id="matricula"
              name="matricula"
              type="text"
              required
              value={form.matricula}
              onChange={handleChange}
              placeholder="Ex.: 10001"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-800
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500
                focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="cpf">
              CPF
            </label>
            <input
              id="cpf"
              name="cpf"
              type="text"
              required
              inputMode="numeric"
              value={form.cpf}
              onChange={handleChange}
              placeholder="000.000.000-00"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-800
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500
                focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="dataNascimento">
              Data de Nascimento
            </label>
            <input
              id="dataNascimento"
              name="dataNascimento"
              type="date"
              required
              value={form.dataNascimento}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-800
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="dataAdmissao">
              Data de Admissão
            </label>
            <input
              id="dataAdmissao"
              name="dataAdmissao"
              type="date"
              required
              value={form.dataAdmissao}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-800
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {erro && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">{erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white
              font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none
              focus:ring-4 focus:ring-blue-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Validando...
              </>
            ) : (
              'Enviar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
