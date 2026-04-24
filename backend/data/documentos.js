// Catálogo de documentos mockados por CPF, simulando a estrutura do Azure Blob Storage
const documentosPorCpf = {
  '12345678900': {
    IR: [
      { ano: 2024, arquivo: 'INF_2024_12345678900.pdf', path: 'IR/2024' },
      { ano: 2025, arquivo: 'INF_2025_12345678900.pdf', path: 'IR/2025' },
    ],
    BOLETO: [
      { mes: '01', ano: 2025, arquivo: 'BLT_01_2025_12345678900.pdf', path: 'BOLETOS/2025/01' },
      { mes: '02', ano: 2025, arquivo: 'BLT_02_2025_12345678900.pdf', path: 'BOLETOS/2025/02' },
      { mes: '03', ano: 2025, arquivo: 'BLT_03_2025_12345678900.pdf', path: 'BOLETOS/2025/03' },
    ],
  },
  '23456789011': {
    IR: [
      { ano: 2024, arquivo: 'INF_2024_23456789011.pdf', path: 'IR/2024' },
      { ano: 2025, arquivo: 'INF_2025_23456789011.pdf', path: 'IR/2025' },
    ],
    BOLETO: [
      { mes: '01', ano: 2025, arquivo: 'BLT_01_2025_23456789011.pdf', path: 'BOLETOS/2025/01' },
      { mes: '02', ano: 2025, arquivo: 'BLT_02_2025_23456789011.pdf', path: 'BOLETOS/2025/02' },
    ],
  },
  '34567890122': {
    IR: [
      { ano: 2024, arquivo: 'INF_2024_34567890122.pdf', path: 'IR/2024' },
      { ano: 2025, arquivo: 'INF_2025_34567890122.pdf', path: 'IR/2025' },
    ],
    BOLETO: [
      { mes: '01', ano: 2025, arquivo: 'BLT_01_2025_34567890122.pdf', path: 'BOLETOS/2025/01' },
    ],
  },
  '45678901233': {
    IR: [
      { ano: 2025, arquivo: 'INF_2025_45678901233.pdf', path: 'IR/2025' },
    ],
    BOLETO: [
      { mes: '01', ano: 2025, arquivo: 'BLT_01_2025_45678901233.pdf', path: 'BOLETOS/2025/01' },
      { mes: '02', ano: 2025, arquivo: 'BLT_02_2025_45678901233.pdf', path: 'BOLETOS/2025/02' },
      { mes: '03', ano: 2025, arquivo: 'BLT_03_2025_45678901233.pdf', path: 'BOLETOS/2025/03' },
    ],
  },
  '56789012344': {
    IR: [
      { ano: 2024, arquivo: 'INF_2024_56789012344.pdf', path: 'IR/2024' },
      { ano: 2025, arquivo: 'INF_2025_56789012344.pdf', path: 'IR/2025' },
    ],
    BOLETO: [
      { mes: '01', ano: 2025, arquivo: 'BLT_01_2025_56789012344.pdf', path: 'BOLETOS/2025/01' },
    ],
  },
};

module.exports = documentosPorCpf;
