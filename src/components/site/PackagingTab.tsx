import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";

export function PackagingTab() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock data - será substituído por dados reais
  const packagingData = [
    { id: 1, name: "Frasco de Vidro 500ml", type: "Vidro", capacity: "500ml", status: "Ativo" },
    { id: 2, name: "Tambor HDPE 200L", type: "Plástico", capacity: "200L", status: "Ativo" },
    { id: 3, name: "Saco Papel Kraft 25kg", type: "Papel", capacity: "25kg", status: "Inativo" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex gap-2 justify-start">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Embalagem
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar embalagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Packaging table */}
      <Card>
        <CardHeader>
          <CardTitle>Embalagens Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packagingData
                  .filter(item => 
                    searchTerm === "" || 
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.type.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                      </TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.capacity}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "Ativo" ? "default" : "secondary"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {/* TODO: implementar edição */}}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {/* TODO: implementar exclusão */}}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}