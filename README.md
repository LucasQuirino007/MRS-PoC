# mrs-doc-consulta

PoC MRS — Portal de Consulta de Documentos do Colaborador.

Permite ao colaborador consultar **Informes de Rendimentos** e **Boletos do Plano de Saúde** após validação de identidade, com links de acesso temporários (simulando SAS Tokens do Azure Blob Storage).

---

## Estrutura do Projeto

```
mrs-doc-consulta/
├── backend/                   # Servidor Node.js + Express
│   ├── data/
│   │   ├── colaboradores.js   # 5 colaboradores fictícios
│   │   └── documentos.js      # Catálogo de documentos por CPF
│   ├── docs/
│   │   └── openapi.yaml       # Documentação OpenAPI 3.0 (Swagger)
│   ├── routes/
│   │   ├── validar.js         # POST /api/validar-colaborador
│   │   └── documentos.js      # GET  /api/documentos/:cpf
│   │                          # POST /api/documentos/upload
│   ├── storage/               # Simulação do Azure Blob Storage
│   │   ├── IR/2024/
│   │   ├── IR/2025/
│   │   └── BOLETOS/2025/01|02|03/
│   ├── server.js
│   └── package.json
│
└── frontend/                  # React + Vite + Tailwind CSS
    ├── src/
    │   ├── components/
    │   │   ├── TipoDocumentoSelector.jsx
    │   │   ├── FormularioValidacao.jsx
    │   │   └── ListaDocumentos.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Como Rodar

### Pré-requisitos

- Node.js 18+
- npm 9+

### 1. Backend

```bash
cd backend
npm install
npm run dev     # usa nodemon (hot reload)
# ou
npm start       # produção
```

Servidor disponível em: **http://localhost:3001**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicação disponível em: **http://localhost:5173**

> O Vite está configurado com proxy para `/api → http://localhost:3001`, então não é necessário configurar CORS manualmente no browser.

---

## API

> 📄 A documentação completa no formato **OpenAPI 3.0** está em [`backend/docs/openapi.yaml`](backend/docs/openapi.yaml).
> Você pode visualizá-la no [Swagger Editor](https://editor.swagger.io/) ou no [Swagger UI](https://swagger.io/tools/swagger-ui/).

---

### `POST /api/validar-colaborador`

Valida o colaborador contra os dados mockados.

**Body:**
```json
{
  "matricula": "10001",
  "cpf": "123.456.789-00",
  "dataNascimento": "1985-03-15",
  "dataAdmissao": "2010-06-01"
}
```

**Resposta (sucesso):**
```json
{
  "sucesso": true,
  "colaborador": {
    "nome": "João Silva",
    "cpf": "12345678900",
    "matricula": "10001"
  }
}
```

**Resposta (não encontrado — HTTP 404):**
```json
{
  "sucesso": false,
  "mensagem": "Pessoa não localizada. Verifique os dados informados."
}
```

---

### `GET /api/documentos/:cpf?tipo=IR|BOLETO`

Retorna os documentos disponíveis com links temporários (SAS token simulado).

**Exemplo:** `GET /api/documentos/12345678900?tipo=IR`

**Resposta:**
```json
{
  "sucesso": true,
  "documentos": [
    {
      "id": "uuid-gerado",
      "nome": "INF_2024_12345678900.pdf",
      "descricao": "Informe de Rendimentos 2024",
      "tipo": "IR",
      "url": "https://mrsstoragepoc.blob.core.windows.net/documentos-colaboradores/IR/2024/INF_2024_12345678900.pdf?sv=...&sig=...",
      "expiraEm": "2026-04-24T16:00:00.000Z"
    }
  ]
}
```

**Erros:**
| HTTP | Mensagem |
|------|----------|
| 400  | `Parâmetro "tipo" inválido. Use IR ou BOLETO.` |
| 404  | `Documento não localizado para o CPF informado.` |
| 404  | `Documento não localizado.` |

---

### `POST /api/documentos/upload` ⭐ novo

Simula o **upload de um novo boleto** do plano de saúde para o colaborador informado.
O registro é mantido em memória (não persiste em disco) e uma URL com SAS token simulado
é retornada com validade de **1 hora**.

**Body:**
```json
{
  "cpf": "123.456.789-00",
  "mes": "03",
  "ano": "2025"
}
```

| Campo | Tipo   | Obrigatório | Validação |
|-------|--------|-------------|-----------|
| `cpf` | string | ✅ | 11 dígitos numéricos (máscara aceita e removida automaticamente) |
| `mes` | string | ✅ | Valor entre `01` e `12` |
| `ano` | string | ✅ | Exatamente 4 dígitos numéricos |

**Nome do arquivo gerado:** `BLT_MM_AAAA_CPF.pdf`
> Exemplo: `BLT_03_2025_12345678900.pdf`

**Resposta (sucesso — HTTP 201):**
```json
{
  "sucesso": true,
  "mensagem": "Boleto enviado com sucesso.",
  "documento": {
    "id": "d4e5f6a7-b8c9-0123-def0-234567890123",
    "nome": "BLT_03_2025_12345678900.pdf",
    "descricao": "Boleto Plano de Saúde — 03/2025",
    "tipo": "BOLETO",
    "url": "https://mrsstoragepoc.blob.core.windows.net/documentos-colaboradores/BOLETOS/2025/03/BLT_03_2025_12345678900.pdf?sv=2024-08-04&se=...&sp=r&sig=...",
    "expiraEm": "2026-01-01T14:00:00.000Z"
  }
}
```

**Erros:**
| HTTP | Cenário | Mensagem |
|------|---------|----------|
| 400  | Campo ausente | `Os campos "cpf", "mes" e "ano" são obrigatórios.` |
| 400  | CPF inválido | `CPF inválido. Informe um CPF com 11 dígitos numéricos.` |
| 400  | Mês inválido | `Mês inválido. Informe um valor entre 01 e 12.` |
| 400  | Ano inválido | `Ano inválido. Informe um ano com 4 dígitos.` |

---

## Dados Mockados — Colaboradores

| Matrícula | Nome             | CPF             | Data Nasc.  | Data Admissão |
|-----------|------------------|-----------------|-------------|---------------|
| 10001     | João Silva       | 123.456.789-00  | 1985-03-15  | 2010-06-01    |
| 10002     | Maria Santos     | 234.567.890-11  | 1990-07-22  | 2015-02-10    |
| 10003     | Carlos Oliveira  | 345.678.901-22  | 1978-11-05  | 2008-09-15    |
| 10004     | Ana Ferreira     | 456.789.012-33  | 1995-01-30  | 2020-03-22    |
| 10005     | Pedro Costa      | 567.890.123-44  | 1982-08-18  | 2012-11-01    |

---

## Tecnologias

| Camada   | Tecnologia                       |
|----------|----------------------------------|
| Backend  | Node.js, Express, uuid           |
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Storage  | Simulação de Azure Blob Storage  |
