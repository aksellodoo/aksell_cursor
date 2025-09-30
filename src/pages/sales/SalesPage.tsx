
import { Routes, Route } from "react-router-dom";
import { GroupMembersManager } from "./GroupMembersManager";

const SalesPage = () => {
  return (
    <div className="container mx-auto p-6">
      <Routes>
        <Route path="cadastros/grupos/:groupId/gerenciar" element={<GroupMembersManager />} />
        <Route path="*" element={
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">Área de Vendas</h1>
            <p className="text-muted-foreground">Selecione uma opção no menu</p>
          </div>
        } />
      </Routes>
    </div>
  );
};

export default SalesPage;
