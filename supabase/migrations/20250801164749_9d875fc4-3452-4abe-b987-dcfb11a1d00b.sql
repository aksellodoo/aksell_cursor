-- Add new fields to protheus_config table for Oracle proxy documentation
ALTER TABLE public.protheus_config 
ADD COLUMN oracle_proxy_code TEXT DEFAULT '',
ADD COLUMN endpoints_documentation JSONB DEFAULT '{
  "endpoints": [
    {
      "method": "GET",
      "path": "/ping",
      "description": "Verifica status do servidor Oracle Proxy",
      "response": "Oracle Proxy Online ✔️",
      "authentication": "Requer x-api-key header"
    },
    {
      "method": "GET", 
      "path": "/consulta",
      "description": "Consulta exemplo de clientes (primeiros 10 registros)",
      "response": "Array com A1_COD e A1_NOME da tabela SA1010",
      "authentication": "Requer x-api-key header"
    },
    {
      "method": "POST",
      "path": "/sql",
      "description": "Executa queries SQL customizadas",
      "body": {"query": "SELECT statement"},
      "restrictions": ["Apenas SELECT permitido", "Proibido: DELETE, DROP, UPDATE, INSERT", "Não permite múltiplas queries (;)"],
      "response": "Array com resultados da query",
      "authentication": "Requer x-api-key header"
    }
  ],
  "authentication": {
    "type": "API Key",
    "header": "x-api-key",
    "description": "Chave de API necessária em todas as requisições"
  },
  "security": {
    "restrictions": [
      "Apenas operações SELECT são permitidas",
      "Comandos DELETE, DROP, UPDATE, INSERT são bloqueados",
      "Múltiplas queries separadas por ; são proibidas"
    ]
  }
}'::jsonb;