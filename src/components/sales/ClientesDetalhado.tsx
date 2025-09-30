import { useState } from 'react';
import { useProtheusSyncedData } from '@/hooks/useProtheusSyncedData';
import { ProtheusTableToolbar } from '@/components/ProtheusTableToolbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Users, Building, Loader2 } from 'lucide-react';
import { PROTHEUS_TABLES } from '@/lib/config';

export const ClientesDetalhado = () => {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  
  const { 
    data, 
    loading, 
    error, 
    lastSyncAt, 
    refreshData 
  } = useProtheusSyncedData(PROTHEUS_TABLES.SA1010_CLIENTES);

  const columns = [
    {
      accessorKey: 'a1_filial',
      header: 'Filial',
      cell: ({ row }: any) => (
        <span className="font-mono text-sm">{row.getValue('a1_filial')}</span>
      ),
    },
    {
      accessorKey: 'a1_cod',
      header: 'Código',
      cell: ({ row }: any) => (
        <span className="font-mono text-sm">{row.getValue('a1_cod')}</span>
      ),
    },
    {
      accessorKey: 'a1_loja',
      header: 'Loja',
      cell: ({ row }: any) => (
        <span className="font-mono text-sm">{row.getValue('a1_loja')}</span>
      ),
    },
    {
      accessorKey: 'a1_nome',
      header: 'Nome',
      cell: ({ row }: any) => (
        <div className="max-w-[200px]">
          <div className="font-medium truncate">{row.getValue('a1_nome')}</div>
          {row.original.a1_nreduz && (
            <div className="text-sm text-muted-foreground truncate">
              {row.original.a1_nreduz}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'a1_cgc',
      header: 'CNPJ/CPF',
      cell: ({ row }: any) => {
        const cgc = row.getValue('a1_cgc');
        if (!cgc) return '-';
        
        // Format CNPJ/CPF
        const formatted = cgc.length === 14 
          ? cgc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
          : cgc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        
        return <span className="font-mono text-sm">{formatted}</span>;
      },
    },
    {
      accessorKey: 'a1_est',
      header: 'UF',
      cell: ({ row }: any) => (
        <Badge variant="outline" className="font-mono">
          {row.getValue('a1_est')}
        </Badge>
      ),
    },
    {
      accessorKey: 'a1_mun',
      header: 'Cidade',
      cell: ({ row }: any) => (
        <span className="text-sm">{row.getValue('a1_mun')}</span>
      ),
    },
    {
      accessorKey: 'a1_vend',
      header: 'Vendedor',
      cell: ({ row }: any) => {
        const vendedor = row.getValue('a1_vend');
        return vendedor ? (
          <Badge variant="secondary" className="font-mono">
            {vendedor}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Sem vendedor</span>
        );
      },
    },
    {
      accessorKey: 'a1_msblql',
      header: 'Status',
      cell: ({ row }: any) => {
        const bloqueado = row.getValue('a1_msblql') === '1';
        return (
          <Badge variant={bloqueado ? 'destructive' : 'default'}>
            {bloqueado ? 'Bloqueado' : 'Ativo'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedRecord(row.original)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Visualizar
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building className="h-5 w-5" />
            Clientes Detalhado
          </h3>
          <p className="text-sm text-muted-foreground">
            Visualização detalhada dos clientes importados do Protheus
          </p>
        </div>
      </div>

      {/* Toolbar - Simple version */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {data?.length || 0} registros • 
              {lastSyncAt ? `Última sincronização: ${new Date(lastSyncAt).toLocaleString('pt-BR')}` : 'Não sincronizado'}
            </div>
            <Button 
              onClick={refreshData} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                'Atualizar'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Lista de Clientes ({data?.length || 0})
          </CardTitle>
          <CardDescription>
            Dados completos dos clientes sincronizados do sistema Protheus
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Simple table instead of DataTable */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-2 text-left">Filial</th>
                  <th className="border border-gray-200 p-2 text-left">Código</th>
                  <th className="border border-gray-200 p-2 text-left">Loja</th>
                  <th className="border border-gray-200 p-2 text-left">Nome</th>
                  <th className="border border-gray-200 p-2 text-left">CNPJ/CPF</th>
                  <th className="border border-gray-200 p-2 text-left">UF</th>
                  <th className="border border-gray-200 p-2 text-left">Cidade</th>
                  <th className="border border-gray-200 p-2 text-left">Vendedor</th>
                  <th className="border border-gray-200 p-2 text-left">Status</th>
                  <th className="border border-gray-200 p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((client: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-2 font-mono text-sm">{client.a1_filial}</td>
                    <td className="border border-gray-200 p-2 font-mono text-sm">{client.a1_cod}</td>
                    <td className="border border-gray-200 p-2 font-mono text-sm">{client.a1_loja}</td>
                    <td className="border border-gray-200 p-2">
                      <div className="max-w-[200px]">
                        <div className="font-medium truncate">{client.a1_nome}</div>
                        {client.a1_nreduz && (
                          <div className="text-sm text-muted-foreground truncate">{client.a1_nreduz}</div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-200 p-2 font-mono text-sm">
                      {client.a1_cgc ? (
                        client.a1_cgc.length === 14 
                          ? client.a1_cgc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                          : client.a1_cgc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                      ) : '-'}
                    </td>
                    <td className="border border-gray-200 p-2">
                      <Badge variant="outline" className="font-mono">{client.a1_est}</Badge>
                    </td>
                    <td className="border border-gray-200 p-2 text-sm">{client.a1_mun}</td>
                    <td className="border border-gray-200 p-2">
                      {client.a1_vend ? (
                        <Badge variant="secondary" className="font-mono">{client.a1_vend}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sem vendedor</span>
                      )}
                    </td>
                    <td className="border border-gray-200 p-2">
                      <Badge variant={client.a1_msblql === '1' ? 'destructive' : 'default'}>
                        {client.a1_msblql === '1' ? 'Bloqueado' : 'Ativo'}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRecord(client)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Details Modal - Simple viewer */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Detalhes do Cliente</CardTitle>
              <CardDescription>
                {selectedRecord.a1_nome} ({selectedRecord.a1_cod})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Filial:</label>
                  <div className="font-mono">{selectedRecord.a1_filial}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Loja:</label>
                  <div className="font-mono">{selectedRecord.a1_loja}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Nome:</label>
                  <div>{selectedRecord.a1_nome}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Nome Reduzido:</label>
                  <div>{selectedRecord.a1_nreduz}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">CNPJ/CPF:</label>
                  <div className="font-mono">{selectedRecord.a1_cgc}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Vendedor:</label>
                  <div className="font-mono">{selectedRecord.a1_vend || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">UF:</label>
                  <div>{selectedRecord.a1_est}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Cidade:</label>
                  <div>{selectedRecord.a1_mun}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Endereço:</label>
                  <div>{selectedRecord.a1_end}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">CEP:</label>
                  <div className="font-mono">{selectedRecord.a1_cep}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone:</label>
                  <div className="font-mono">{selectedRecord.a1_tel}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">E-mail:</label>
                  <div>{selectedRecord.a1_email}</div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setSelectedRecord(null)}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};