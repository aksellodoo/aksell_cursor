import { useEntityDetailsStatus } from '@/hooks/useEntityDetailsStatus';
import { ContactEntity } from '@/hooks/useContactEntities';
import { Badge } from '@/components/ui/badge';

interface EntityStatusBadgeProps {
  entity: ContactEntity;
}

export function EntityStatusBadge({ entity }: EntityStatusBadgeProps) {
  const { hasDetails, loading } = useEntityDetailsStatus(entity.id, entity.type);

  if (loading) {
    return null;
  }

  if (!hasDetails && (entity.type === 'parceiros_externos' || entity.type === 'orgaos_publicos_controle' || entity.type === 'associacoes_sindicatos')) {
    return (
      <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
        sem detalhes
      </Badge>
    );
  }

  return null;
}