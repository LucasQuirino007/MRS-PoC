const request = require('supertest');
const express = require('express');

// ─── App mínimo para testes (sem iniciar o listen do server.js) ───────────────
function criarApp(dadosMock) {
  // Permite injetar dados mockados por teste
  jest.resetModules();
  if (dadosMock !== undefined) {
    jest.doMock('../data/documentos', () => dadosMock);
  }
  const documentosRoute = require('../routes/documentos');
  const app = express();
  app.use(express.json());
  app.use('/api', documentosRoute);
  return app;
}

// ─── Mock do uuid para tornar as asserções determinísticas ───────────────────
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234-5678-abcd'),
}));

// CPF presente nos dados mockados reais
const CPF_VALIDO = '12345678900';
const CPF_COM_MASCARA = '123.456.789-00';
const CPF_INEXISTENTE = '00000000000';

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/documentos/:cpf', () => {

  // ── Casos de sucesso ────────────────────────────────────────────────────────

  describe('Sucesso', () => {
    let app;

    beforeEach(() => {
      app = criarApp();
    });

    it('deve retornar lista de IR para CPF válido', async () => {
      // Arrange
      const tipo = 'IR';

      // Act
      const res = await request(app)
        .get(`/api/documentos/${CPF_VALIDO}?tipo=${tipo}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(Array.isArray(res.body.documentos)).toBe(true);
      expect(res.body.documentos.length).toBeGreaterThan(0);

      const doc = res.body.documentos[0];
      expect(doc).toHaveProperty('id');
      expect(doc).toHaveProperty('nome');
      expect(doc).toHaveProperty('descricao');
      expect(doc).toHaveProperty('url');
      expect(doc).toHaveProperty('expiraEm');
      expect(doc.tipo).toBe('IR');
      expect(doc.descricao).toMatch(/Informe de Rendimentos/);
    });

    it('deve retornar lista de BOLETO para CPF válido', async () => {
      // Arrange
      const tipo = 'BOLETO';

      // Act
      const res = await request(app)
        .get(`/api/documentos/${CPF_VALIDO}?tipo=${tipo}`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.documentos.length).toBeGreaterThan(0);

      const doc = res.body.documentos[0];
      expect(doc.tipo).toBe('BOLETO');
      expect(doc.descricao).toMatch(/Boleto Plano de Saúde/);
    });

    it('deve aceitar CPF com máscara (pontos e traço) e retornar documentos', async () => {
      // Arrange — CPF formatado: 123.456.789-00

      // Act
      const res = await request(app)
        .get(`/api/documentos/${CPF_COM_MASCARA}?tipo=IR`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.documentos.length).toBeGreaterThan(0);
    });

    it('deve retornar URL com estrutura de SAS token simulado', async () => {
      // Arrange
      const res = await request(app)
        .get(`/api/documentos/${CPF_VALIDO}?tipo=IR`);

      // Act
      const { url, expiraEm } = res.body.documentos[0];

      // Assert — verifica estrutura da URL e presença dos parâmetros de SAS
      expect(url).toMatch(/^https:\/\/mrsstoragepoc\.blob\.core\.windows\.net\/documentos-colaboradores/);
      expect(url).toContain('sv=');
      expect(url).toContain('se=');
      expect(url).toContain('sp=r');
      expect(url).toContain('sig=');
      expect(new Date(expiraEm).getTime()).toBeGreaterThan(Date.now());
    });

    it('deve aceitar tipo em minúsculo e converter corretamente', async () => {
      // Arrange — envia "ir" em vez de "IR"

      // Act
      const res = await request(app)
        .get(`/api/documentos/${CPF_VALIDO}?tipo=ir`);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
    });
  });

  // ── Validação de parâmetros ─────────────────────────────────────────────────

  describe('Validação do parâmetro tipo', () => {
    let app;

    beforeEach(() => {
      app = criarApp();
    });

    it('deve retornar 400 quando o parâmetro tipo está ausente', async () => {
      // Arrange — sem query string

      // Act
      const res = await request(app)
        .get(`/api/documentos/${CPF_VALIDO}`);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/inválido/i);
    });

    it('deve retornar 400 quando tipo é um valor desconhecido', async () => {
      // Arrange
      const tipoInvalido = 'RECIBO';

      // Act
      const res = await request(app)
        .get(`/api/documentos/${CPF_VALIDO}?tipo=${tipoInvalido}`);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toContain('Use IR ou BOLETO');
    });

    it('deve retornar 400 quando tipo é string vazia', async () => {
      // Act
      const res = await request(app)
        .get(`/api/documentos/${CPF_VALIDO}?tipo=`);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.sucesso).toBe(false);
    });
  });

  // ── CPF não localizado ──────────────────────────────────────────────────────

  describe('CPF não localizado', () => {
    let app;

    beforeEach(() => {
      app = criarApp();
    });

    it('deve retornar 404 quando CPF não existe na base', async () => {
      // Arrange
      const tipo = 'IR';

      // Act
      const res = await request(app)
        .get(`/api/documentos/${CPF_INEXISTENTE}?tipo=${tipo}`);

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toMatch(/não localizado/i);
    });

    it('deve retornar 404 quando CPF contém apenas zeros', async () => {
      // Act
      const res = await request(app)
        .get('/api/documentos/00000000000?tipo=BOLETO');

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.sucesso).toBe(false);
    });
  });

  // ── CPF existe mas tipo não possui documentos ───────────────────────────────

  describe('Documentos não encontrados para o tipo', () => {
    it('deve retornar 404 quando CPF existe mas lista do tipo está vazia', async () => {
      // Arrange — injeta dado onde o CPF existe mas BOLETO é vazio
      const dadosMock = {
        '99988877766': {
          IR: [{ ano: 2025, arquivo: 'INF_2025_99988877766.pdf', path: 'IR/2025' }],
          BOLETO: [],
        },
      };
      const app = criarApp(dadosMock);

      // Act
      const res = await request(app)
        .get('/api/documentos/99988877766?tipo=BOLETO');

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toBe('Documento não localizado.');
    });

    it('deve retornar 404 quando CPF existe mas tipo não está definido nos dados', async () => {
      // Arrange — injeta dado onde o CPF só tem IR, sem chave BOLETO
      const dadosMock = {
        '11122233344': {
          IR: [{ ano: 2025, arquivo: 'INF_2025_11122233344.pdf', path: 'IR/2025' }],
        },
      };
      const app = criarApp(dadosMock);

      // Act
      const res = await request(app)
        .get('/api/documentos/11122233344?tipo=BOLETO');

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.sucesso).toBe(false);
      expect(res.body.mensagem).toBe('Documento não localizado.');
    });
  });

  // ── Formato e integridade da resposta ──────────────────────────────────────

  describe('Formato da resposta', () => {
    let app;

    beforeEach(() => {
      app = criarApp();
    });

    it('deve retornar Content-Type application/json', async () => {
      const res = await request(app)
        .get(`/api/documentos/${CPF_VALIDO}?tipo=IR`);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('deve retornar a quantidade correta de documentos IR para João Silva', async () => {
      // João Silva (12345678900) tem 2 documentos IR: 2024 e 2025
      const res = await request(app)
        .get(`/api/documentos/${CPF_VALIDO}?tipo=IR`);

      expect(res.body.documentos).toHaveLength(2);
    });

    it('deve retornar a quantidade correta de boletos para João Silva', async () => {
      // João Silva (12345678900) tem 3 boletos: 01, 02 e 03/2025
      const res = await request(app)
        .get(`/api/documentos/${CPF_VALIDO}?tipo=BOLETO`);

      expect(res.body.documentos).toHaveLength(3);
    });

    it('cada documento deve ter id único (uuid)', async () => {
      // Act
      const res = await request(app)
        .get(`/api/documentos/${CPF_VALIDO}?tipo=BOLETO`);

      const ids = res.body.documentos.map((d) => d.id);
      const idsUnicos = new Set(ids);

      // Assert — todos os ids são strings não-vazias
      ids.forEach((id) => expect(typeof id).toBe('string'));
      expect(idsUnicos.size).toBe(ids.length);
    });
  });
});
