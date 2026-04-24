export default function TipoDocumentoSelector({ onSelecionar }) {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">O que você deseja consultar?</h2>
        <p className="text-slate-500 mt-2">Selecione o tipo de documento para continuar.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Informe de Rendimentos */}
        <button
          onClick={() => onSelecionar('IR')}
          className="group flex flex-col items-center gap-4 p-8 bg-white border-2 border-slate-200
            rounded-2xl shadow-sm hover:border-blue-600 hover:shadow-md transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center
            group-hover:bg-blue-100 transition-colors">
            <svg className="w-8 h-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
              Informe de Rendimentos
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Acesse seu Informe de Rendimentos para declaração do Imposto de Renda.
            </p>
          </div>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full
            group-hover:bg-blue-600 group-hover:text-white transition-colors">
            IR 2024 / 2025
          </span>
        </button>

        {/* Boletos do Plano de Saúde */}
        <button
          onClick={() => onSelecionar('BOLETO')}
          className="group flex flex-col items-center gap-4 p-8 bg-white border-2 border-slate-200
            rounded-2xl shadow-sm hover:border-blue-600 hover:shadow-md transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center
            group-hover:bg-teal-100 transition-colors">
            <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4.5 12.75l6 6 9-13.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
              Boletos do Plano de Saúde
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Acesse os boletos mensais do seu plano de saúde coletivo.
            </p>
          </div>
          <span className="text-xs font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full
            group-hover:bg-teal-600 group-hover:text-white transition-colors">
            2025
          </span>
        </button>
      </div>
    </div>
  );
}
