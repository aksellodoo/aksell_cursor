
import { ReactElement } from 'react';
import VendasCadastros from './pages/VendasCadastros';
import PotentialSuppliers from './pages/PotentialSuppliers';
import UnifiedSuppliersPage from './pages/purchases/UnifiedSuppliersPage';

export interface NavItem {
  to: string;
  page: ReactElement;
}

export const navItems: NavItem[] = [
  {
    to: '/vendas/cadastros',
    page: <VendasCadastros />
  },
  {
    to: '/compras/potenciais-fornecedores',
    page: <PotentialSuppliers />
  },
  {
    to: '/compras/fornecedores-unificados',
    page: <UnifiedSuppliersPage />
  }
];
