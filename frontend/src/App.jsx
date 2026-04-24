import { useState } from 'react';
import TipoDocumentoSelector from './components/TipoDocumentoSelector';
import FormularioValidacao from './components/FormularioValidacao';
import ListaDocumentos from './components/ListaDocumentos';

// Passos do fluxo: 1 = Seleção de tipo | 2 = Formulário | 3 = Documentos
export default function App() {
  const [passo, setPasso] = useState(1);
  const [tipoDocumento, setTipoDocumento] = useState(null);
  const [colaborador, setColaborador] = useState(null);
  const [documentos, setDocumentos] = useState([]);

  function handleSelecionarTipo(tipo) {
    setTipoDocumento(tipo);
    setPasso(2);
  }

  function handleValidacaoSucesso(dadosColaborador, listaDocumentos) {
    setColaborador(dadosColaborador);
    setDocumentos(listaDocumentos);
    setPasso(3);
  }

  function handleReiniciar() {
    setPasso(1);
    setTipoDocumento(null);
    setColaborador(null);
    setDocumentos([]);
  }

  function handleVoltarFormulario() {
    setPasso(2);
    setColaborador(null);
    setDocumentos([]);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabeçalho */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
            <span className="text-blue-900 font-bold text-sm">MRS</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Portal do Colaborador</h1>
            <p className="text-blue-200 text-xs">Consulta de Documentos</p>
          </div>
        </div>
      </header>

      {/* Indicador de progresso */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <Etapa numero={1} label="Tipo de Documento" ativa={passo === 1} concluida={passo > 1} />
          <Separador />
          <Etapa numero={2} label="Identificação" ativa={passo === 2} concluida={passo > 2} />
          <Separador />
          <Etapa numero={3} label="Documentos" ativa={passo === 3} concluida={false} />
        </div>
      </div>

      {/* Conteúdo principal */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {passo === 1 && (
          <TipoDocumentoSelector onSelecionar={handleSelecionarTipo} />
        )}
        {passo === 2 && (
          <FormularioValidacao
            tipoDocumento={tipoDocumento}
            onSucesso={handleValidacaoSucesso}
            onVoltar={() => setPasso(1)}
          />
        )}
        {passo === 3 && (
          <ListaDocumentos
            colaborador={colaborador}
            documentos={documentos}
            tipoDocumento={tipoDocumento}
            onNovaConsulta={handleReiniciar}
            onVoltar={handleVoltarFormulario}
          />
        )}
      </main>
    </div>
  );
}

function Etapa({ numero, label, ativa, concluida }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
          ${concluida ? 'bg-green-500 text-white' : ativa ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-500'}`}
      >
        {concluida ? '✓' : numero}
      </div>
      <span className={`hidden sm:inline ${ativa ? 'text-blue-900 font-medium' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}

function Separador() {
  return <div className="flex-1 h-px bg-slate-200 mx-1" />;
}
