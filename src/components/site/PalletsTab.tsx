import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";

export function PalletsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock data - será substituído por dados reais
  const palletsData = [
    { id: 1, name: "Pallet Europeu", dimensions: "120x80x15cm", capacity: "1000kg", status: "Ativo" },
    { id: 2, name: "Pallet Americano", dimensions: "120x100x15cm", capacity: "1200kg", status: "Ativo" },
    { id: 3, name: "Pallet Plástico", dimensions: "100x100x15cm", capacity: "800kg", status: "Inativo" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex gap-2 justify-start">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Pallets do Site
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pallets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pallets table */}
      <Card>
        <CardHeader>
          <CardTitle>Pallets Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Dimensões</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {palletsData
                  .filter(item => 
                    searchTerm === "" || 
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.dimensions.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                      </TableCell>
                      <TableCell>{item.dimensions}</TableCell>
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