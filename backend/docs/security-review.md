# Relatório de Revisão de Segurança — `POST /api/documentos/upload`

**Projeto:** MRS PoC — Consulta de Documentos  
**Arquivo revisado:** `backend/routes/documentos.js` + `backend/server.js`  
**Data:** 2025-07-11  
**Revisor:** Agente de Revisão de Segurança  
**Contexto:** Proof of Concept (PoC) — limitações arquiteturais esperadas estão documentadas, mas não ignoradas.

---

## Sumário Executivo

A revisão identificou **3 achados críticos**, **8 importantes** e **5 sugestões** no endpoint `POST /api/documentos/upload` e na infraestrutura do servidor Express. Os achados críticos incluem: ausência total de autenticação/autorização, uma falha de _Insecure Direct Object Reference_ (IDOR) que permite que qualquer agente externo registre documentos em nome de qualquer CPF, e um crash de handler não tratado via input malformado. **8 dos 16 achados foram corrigidos diretamente no código**; os demais requerem mudanças arquiteturais.

---

## Tabela de Achados

| # | Severidade | Achado | Arquivo | Status |
|---|-----------|--------|---------|--------|
| 1 | 🔴 Crítico | Ausência de Autenticação e Autorização | `server.js` / `documentos.js` | ⚠️ Documentado (mudança arquitetural) |
| 2 | 🔴 Crítico | IDOR — Upload para CPF arbitrário sem verificação de identidade | `documentos.js` | ⚠️ Documentado (mudança arquitetural) |
| 3 | 🔴 Crítico | TypeError não tratado em `limparCpf()` com input não-string | `documentos.js` | ✅ Corrigido |
| 4 | 🟡 Importante | Memory Leak — `uploadsPorCpf` sem limite cresce indefinidamente | `documentos.js` | ✅ Corrigido |
| 5 | 🟡 Importante | Ausência de validação de intervalo para o campo `ano` | `documentos.js` | ✅ Corrigido |
| 6 | 🟡 Importante | Ausência de verificação de duplicatas (mesmo CPF/mês/ano) | `documentos.js` | ✅ Corrigido |
| 7 | 🟡 Importante | `express.json()` sem limite de tamanho de payload | `server.js` | ✅ Corrigido |
| 8 | 🟡 Importante | Shadow variable `path` sobrescreve referência ao módulo Node.js built-in | `documentos.js` | ✅ Corrigido |
| 9 | 🟡 Importante | CORS irrestrito — qualquer origem aceita | `server.js` | ⚠️ Documentado (mudança arquitetural) |
| 10 | 🟡 Importante | Ausência de rate limiting — DoS e brute-force possíveis | `server.js` | ⚠️ Documentado (mudança arquitetural) |
| 11 | 🟡 Importante | Ausência de global error handler — stack trace exposto | `server.js` | ✅ Corrigido |
| 12 | 🟡 Importante | Validação de tipo para `mes` e `ano` — arrays de um elemento passam | `documentos.js` | ✅ Corrigido |
| 13 | 🟢 Sugestão | CPF exposto em nome de arquivo e URL gerada (LGPD) | `documentos.js` | ⚠️ Documentado |
| 14 | 🟢 Sugestão | `id` do documento não é determinístico — quebra idempotência | `documentos.js` | ⚠️ Documentado |
| 15 | 🟢 Sugestão | Inconsistência entre `uploadsPorCpf` e `documentosPorCpf` | `documentos.js` | ⚠️ Documentado |
| 16 | 🟢 Sugestão | Ausência de logging de auditoria para operações com CPF (LGPD) | `documentos.js` | ⚠️ Documentado |

---

## Achados Detalhados

---

### 🔴 [1] Ausência de Autenticação e Autorização

**Arquivo:** `server.js`, `documentos.js`  
**Status:** ⚠️ Documentado — requer mudança arquitetural  

**Descrição:**  
Nenhum dos endpoints (`GET /api/documentos/:cpf`, `POST /api/documentos/upload`, `POST /api/validar-colaborador`) possui qualquer mecanismo de autenticação. Qualquer agente com acesso à rede pode executar operações e receber dados de documentos sem se identificar.

**Impacto:**  
Embora esperado em uma PoC, em produção isso permitiria acesso irrestrito a dados sensíveis (CPF, documentos financeiros) e operações de upload.

**Recomendação para produção:**
```js
// Exemplo com JWT Bearer Token
const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ sucesso: false, mensagem: 'Token não informado.' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ sucesso: false, mensagem: 'Token inválido ou expirado.' });
  }
}

router.post('/documentos/upload', autenticar, (req, res) => { ... });
```

---

### 🔴 [2] IDOR — Insecure Direct Object Reference

**Arquivo:** `documentos.js`  
**Status:** ⚠️ Documentado — depende de autenticação (achado #1)  

**Descrição:**  
O endpoint aceita `cpf` no body sem qualquer verificação se o token/sessão do solicitante tem autorização para aquele CPF. Um usuário autenticado como CPF `111.222.333-44` poderia registrar uploads para o CPF `999.888.777-66`.

**Vetor de ataque:**
```bash
# Usuário A faz upload para o CPF do Usuário B
curl -X POST http://localhost:3001/api/documentos/upload \
  -H "Content-Type: application/json" \
  -d '{"cpf": "CPF_DE_OUTRA_PESSOA", "mes": 1, "ano": 2025}'
```

**Recomendação para produção:**
```js
// Após autenticação, garantir que o CPF do token == CPF do body
router.post('/documentos/upload', autenticar, (req, res) => {
  const { cpf } = req.body;
  const cpfAutenticado = req.usuario.cpf; // extraído do JWT

  if (limparCpf(cpf) !== limparCpf(cpfAutenticado)) {
    return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });
  }
  // ... continua
});
```

---

### 🔴 [3] TypeError não tratado em `limparCpf()` com input não-string

**Arquivo:** `documentos.js`, linha 31  
**Status:** ✅ **Corrigido**  

**Descrição:**  
A função `limparCpf()` chamava `.replace()` diretamente sobre o parâmetro `cpf`. Como `express.json()` aceita qualquer tipo JSON válido, um body como `{"cpf": {}, "mes": 1, "ano": 2025}` resultaria em:

```
TypeError: cpf.replace is not a function
```

Sem um error handler global, o Express expunha o stack trace completo na resposta, revelando informações internas do servidor (versão Node.js, caminhos de arquivo, etc.).

**Código vulnerável:**
```js
function limparCpf(cpf) {
  return cpf ? cpf.replace(/\D/g, '') : ''; // ❌ crash se cpf for {}, [], true, 42
}
```

**Código corrigido:**
```js
function limparCpf(cpf) {
  if (typeof cpf !== 'string') return ''; // ✅ type-safe
  return cpf.replace(/\D/g, '');
}
```

**Por que funciona:** se `cpf` não for string, retorna `''`, que falha na regex `^\d{11}$` e retorna HTTP 400 adequado. Nenhuma exceção é lançada.

---

### 🟡 [4] Memory Leak — `uploadsPorCpf` sem limite

**Arquivo:** `documentos.js`, linha 12  
**Status:** ✅ **Corrigido**  

**Descrição:**  
O objeto `uploadsPorCpf` é um singleton de módulo (compartilhado entre todas as requisições, sem TTL ou limpeza). Um atacante poderia enviar uploads com CPFs aleatórios indefinidamente, esgotando a memória do processo Node.js.

**Superfície de ataque:**
```bash
# Script de ~50 linhas poderia enviar milhares de uploads com CPFs aleatórios
for i in $(seq 1 100000); do
  curl -X POST http://localhost:3001/api/documentos/upload \
    -d "{\"cpf\": \"$(printf '%011d' $i)\", \"mes\": 1, \"ano\": 2025}"
done
```

**Correções aplicadas:**
1. Constante `MAX_UPLOADS_POR_CPF = 50` — limita entradas por CPF
2. Verificação antes do `push` retorna HTTP 429 quando o limite é atingido

```js
const MAX_UPLOADS_POR_CPF = 50;

// ...
if (uploadsPorCpf[cpfLimpo].length >= MAX_UPLOADS_POR_CPF) {
  return res.status(429).json({ sucesso: false, mensagem: 'Limite de uploads atingido para este CPF.' });
}
```

> **Nota:** O limite por CPF não endereça o crescimento pelo número de CPFs únicos. Em produção, substituir por banco de dados persistente (achado #15).

---

### 🟡 [5] Ausência de validação de intervalo para o campo `ano`

**Arquivo:** `documentos.js`, linha 134  
**Status:** ✅ **Corrigido**  

**Descrição:**  
A validação original só verificava se `ano` tinha 4 dígitos numéricos (`^\d{4}$`). Valores como `0001`, `1800`, `9999` passavam na validação, gerando nomes de arquivo e paths semanticamente inválidos no contexto da aplicação.

**Correção aplicada:**
```js
if (Number(anoStr) < 2000 || Number(anoStr) > 2100) {
  return res.status(400).json({
    sucesso: false,
    mensagem: 'Ano inválido. Informe um ano entre 2000 e 2100.',
  });
}
```

---

### 🟡 [6] Ausência de verificação de duplicatas

**Arquivo:** `documentos.js`, linha 137  
**Status:** ✅ **Corrigido**  

**Descrição:**  
O mesmo `cpf + mes + ano` poderia ser registrado múltiplas vezes sem qualquer rejeição, inflando o array `uploadsPorCpf[cpfLimpo]` com entradas idênticas.

**Correção aplicada:**
```js
const jaExiste = uploadsPorCpf[cpfLimpo].some(
  (u) => u.mes === mesStr && u.ano === Number(anoStr)
);
if (jaExiste) {
  return res.status(409).json({
    sucesso: false,
    mensagem: 'Já existe um boleto registrado para este CPF, mês e ano.',
  });
}
```

**HTTP 409 Conflict** é a resposta semanticamente correta para tentativa de criação de recurso já existente.

---

### 🟡 [7] `express.json()` sem limite de tamanho de payload

**Arquivo:** `server.js`, linha 11  
**Status:** ✅ **Corrigido**  

**Descrição:**  
O middleware `express.json()` sem opções usa o limite padrão de 100kb. Para este endpoint, o body esperado (`cpf` + `mes` + `ano`) tem menos de 100 bytes. Um body de 100kb poderia ser usado para inflar o consumo de CPU durante o parsing.

**Correção aplicada:**
```js
app.use(express.json({ limit: '10kb' }));
```

---

### 🟡 [8] Shadow variable `path` sobrescreve módulo built-in Node.js

**Arquivo:** `documentos.js`, linha 131 (original)  
**Status:** ✅ **Corrigido**  

**Descrição:**  
A variável local `const path = 'BOLETOS/...'` shadowiava o módulo built-in `path` do Node.js dentro do escopo do handler. Embora `path` não fosse importado neste arquivo, a prática é perigosa: qualquer desenvolvedor que adicionar `const path = require('path')` no topo do arquivo terá comportamento inesperado dentro do handler.

**Correção aplicada:**
```js
// Antes: const path = `BOLETOS/${anoStr}/${mesStr}`;
const blobPath = `BOLETOS/${anoStr}/${mesStr}`; // ✅ nome sem ambiguidade
```

---

### 🟡 [9] CORS irrestrito

**Arquivo:** `server.js`, linha 10  
**Status:** ⚠️ Documentado — requer mudança arquitetural  

**Descrição:**  
`app.use(cors())` sem opções aceita requisições de **qualquer origem**. Em produção, isso permite que sites de terceiros façam requisições autenticadas à API usando as credenciais do usuário (cookies, tokens armazenados no browser).

**Recomendação para produção:**
```js
app.use(cors({
  origin: ['https://mrs.com.br', 'https://app.mrs.com.br'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

### 🟡 [10] Ausência de rate limiting

**Arquivo:** `server.js`  
**Status:** ⚠️ Documentado — requer dependência externa  

**Descrição:**  
Sem rate limiting, o endpoint está exposto a:
- **Brute force de CPF** no `GET /api/documentos/:cpf`
- **DoS via flood** no `POST /api/documentos/upload`
- **Enumeração de dados** de colaboradores válidos

**Recomendação para produção:**
```bash
npm install express-rate-limit
```
```js
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,                   // máximo 20 requisições por IP
  message: { sucesso: false, mensagem: 'Muitas requisições. Tente novamente em 15 minutos.' },
});

router.post('/documentos/upload', uploadLimiter, (req, res) => { ... });
```

---

### 🟡 [11] Ausência de global error handler

**Arquivo:** `server.js`  
**Status:** ✅ **Corrigido**  

**Descrição:**  
Sem um error handler de 4 parâmetros `(err, req, res, next)`, exceções não capturadas em rotas resultavam no error handler padrão do Express, que expõe o stack trace completo como texto HTML — revelando versão do Node.js, caminhos internos e nomes de módulos.

**Correção aplicada em `server.js`:**
```js
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[ERRO INTERNO]', err.message);
  res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
});
```

---

### 🟡 [12] Validação de tipo para `mes` e `ano` — arrays de um elemento passam

**Arquivo:** `documentos.js`  
**Status:** ✅ **Corrigido**  

**Descrição:**  
`String([5])` → `"5"`, que após `padStart(2, '0')` vira `"05"` — passando na regex `^\d{2}$` e no range 1–12. Um body como `{"cpf": "12345678900", "mes": [5], "ano": [2025]}` seria aceito silenciosamente. Isso é uma inconsistência de validação: o valor semântico está correto, mas o tipo de dado não.

**Correção aplicada:**
```js
if (!['string', 'number'].includes(typeof mes) || !['string', 'number'].includes(typeof ano)) {
  return res.status(400).json({
    sucesso: false,
    mensagem: 'Os campos "mes" e "ano" devem ser valores numéricos.',
  });
}
```

---

### 🟢 [13] CPF exposto em nome de arquivo e URL (LGPD)

**Arquivo:** `documentos.js`  
**Status:** ⚠️ Documentado  

**Descrição:**  
O CPF é inserido literalmente no nome do arquivo (`BLT_01_2025_12345678900.pdf`) e consequentemente na URL do Azure Blob Storage retornada ao cliente. O CPF é dado pessoal sensível protegido pela LGPD (Lei 13.709/2018). Sua presença em URLs e nomes de arquivo o expõe em:
- Logs de servidor web / CDN
- Headers `Referer` de navegadores
- Histórico de downloads do usuário
- Ferramentas de monitoramento e APM

**Recomendação:**
```js
// Usar identificador opaco (hash ou UUID derivado) no nome do arquivo
const crypto = require('crypto');
const cpfHash = crypto.createHash('sha256').update(cpfLimpo + process.env.HASH_SALT).digest('hex').slice(0, 16);
const nomeArquivo = `BLT_${mesStr}_${anoStr}_${cpfHash}.pdf`;
```

---

### 🟢 [14] `id` do documento não é determinístico

**Arquivo:** `documentos.js`  
**Status:** ⚠️ Documentado  

**Descrição:**  
`uuidv4()` é chamado a cada requisição para gerar o `id` do documento retornado. Isso significa que o mesmo documento recebe um ID diferente em cada chamada, **quebrando a idempotência do GET e a rastreabilidade do recurso**.

**Recomendação:**  
Derivar o ID de forma determinística a partir do CPF + mês + ano, ou armazenar o ID gerado na primeira vez e reutilizá-lo.

```js
// ID determinístico via hash dos atributos do documento
const idDoc = uuidv5(`${cpfLimpo}-${mesStr}-${anoStr}`, UUID_NAMESPACE);
```

---

### 🟢 [15] Inconsistência entre `uploadsPorCpf` e `documentosPorCpf`

**Arquivo:** `documentos.js`  
**Status:** ⚠️ Documentado  

**Descrição:**  
Documentos registrados via `POST /api/documentos/upload` são armazenados em `uploadsPorCpf`, mas o endpoint `GET /api/documentos/:cpf` lê apenas de `documentosPorCpf` (dados estáticos). Portanto, **uploads registrados nunca aparecem nas consultas**. Além disso, `uploadsPorCpf` é reiniciado a cada restart do servidor (sem persistência).

**Recomendação:**  
Em produção, substituir ambas as estruturas por um banco de dados (ex: PostgreSQL, MongoDB ou Azure Cosmos DB).

---

### 🟢 [16] Ausência de logging de auditoria para operações com CPF (LGPD)

**Arquivo:** `documentos.js`, `validar.js`  
**Status:** ⚠️ Documentado  

**Descrição:**  
A LGPD exige rastreabilidade de acessos a dados pessoais. Nenhuma operação que envolve CPF gera log estruturado (quem acessou, quando, qual CPF, qual operação). Em incidentes de segurança, seria impossível auditar o que aconteceu.

**Recomendação:**
```js
// Log de auditoria estruturado — nunca logar o CPF completo em produção
console.log(JSON.stringify({
  evento: 'UPLOAD_BOLETO',
  cpf_mascarado: `***${cpfLimpo.slice(-3)}`,
  mes: mesStr,
  ano: anoStr,
  ip: req.ip,
  timestamp: new Date().toISOString(),
}));
```

---

### ⚠️ Observação adicional — `POST /api/validar-colaborador`

**Arquivo:** `validar.js`  
**Fora do escopo da revisão principal, mas relevante:**

A rota de validação retorna `colaborador.cpf` em texto plano na resposta de sucesso. Dado que o CPF é exatamente o que foi enviado no request, essa devolução é redundante e desnecessária — o cliente já conhece o CPF. Recomenda-se remover o campo `cpf` da resposta ou substituí-lo por uma versão mascarada.

---

## Resumo das Correções Aplicadas

| Arquivo | Correção | Commit-ready? |
|---------|---------|--------------|
| `routes/documentos.js` | `limparCpf()` type-safe com `typeof` guard | ✅ |
| `routes/documentos.js` | Constante `MAX_UPLOADS_POR_CPF = 50` | ✅ |
| `routes/documentos.js` | Validação de tipo para `mes` e `ano` | ✅ |
| `routes/documentos.js` | Validação de intervalo de ano (2000–2100) | ✅ |
| `routes/documentos.js` | Verificação de duplicatas (HTTP 409) | ✅ |
| `routes/documentos.js` | Limite de entradas por CPF (HTTP 429) | ✅ |
| `routes/documentos.js` | Renomeação `path` → `blobPath` | ✅ |
| `server.js` | `express.json({ limit: '10kb' })` | ✅ |
| `server.js` | Global error handler `(err, req, res, next)` | ✅ |

## Itens que Requerem Ação Arquitetural

| Prioridade | Item | Esforço estimado |
|-----------|------|-----------------|
| 🔴 Alta | Implementar autenticação JWT | Médio |
| 🔴 Alta | Implementar autorização por CPF (IDOR fix) | Baixo (após auth) |
| 🟡 Média | Configurar CORS com whitelist de origens | Baixo |
| 🟡 Média | Implementar rate limiting com `express-rate-limit` | Baixo |
| 🟡 Média | Substituir storage em memória por banco de dados | Alto |
| 🟢 Baixa | Remover CPF do nome de arquivo (hash opaco) | Baixo |
| 🟢 Baixa | Implementar logging de auditoria estruturado | Médio |
| 🟢 Baixa | IDs de documento determinísticos (UUIDv5) | Baixo |

---

*Relatório gerado automaticamente por revisão de código estática. Última atualização: 2025-07-11.*
