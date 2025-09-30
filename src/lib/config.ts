// Configuration constants for the application

// Get base URL for the application
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:8080'; // fallback for server-side
};

// Protheus table IDs
export const PROTHEUS_TABLES = {
  SA3010_VENDEDORES: 'fc3d70f6-97ce-4997-967a-8fd92e615f99',
  SA1010_CLIENTES: '80f17f00-0960-44ac-b810-6f8f1a36ccdc',
  SY1010_COMPRADORES: '3249e97a-0b5e-49c7-a4c8-4a7a5beeab06',
  SA2010_FORNECEDORES: '72a51158-05c5-4e7d-82c6-94f78f7166b3',
  SA4010_TRANSPORTADORAS: 'ea26a13a-783a-431d-9650-523459c2ce14',
} as const;

export type ProtheusTableId = typeof PROTHEUS_TABLES[keyof typeof PROTHEUS_TABLES];