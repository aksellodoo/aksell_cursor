import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormBuilder } from '@/components/FormBuilder';
import { useForms } from '@/hooks/useForms';
import { useToast } from '@/hooks/use-toast';

const FormBuilderFullScreen: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { forms, loading } = useForms();
  const { toast } = useToast();
  const [editingForm, setEditingForm] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const isEditing = Boolean(id);
  const forceTaskUsageStatus = searchParams.get('taskUsage') === 'true';

  // Load form data for editing
  useEffect(() => {
    if (!loading && isEditing && id && forms.length > 0) {
      const formToEdit = forms.find(form => form.id === id);
      if (formToEdit) {
        setEditingForm(formToEdit);
      } else {
        toast({
          title: "Erro",
          description: "Formulário não encontrado",
          variant: "destructive",
        });
        navigate('/formularios');
      }
    }
    setIsHydrated(true);
  }, [loading, isEditing, id, forms, navigate, toast]);

  const handleSave = () => {
    navigate('/formularios');
    toast({
      title: "Sucesso",
      description: `Formulário ${isEditing ? 'atualizado' : 'criado'} com sucesso!`,
    });
  };

  const handleCancel = () => {
    // Clear localStorage for new forms when canceling
    if (!isEditing) {
      try {
        localStorage.removeItem('formBuilder_new');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
    navigate('/formularios');
  };

  // Don't render until hydrated to prevent localStorage conflicts
  if (!isHydrated) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Formulários
          </Button>
          <div className="text-lg font-semibold">
            {isEditing ? 'Editar Formulário' : 'Novo Formulário'}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form Builder */}
      <div className="flex-1 min-h-0 overflow-auto">
        {/* Only render FormBuilder when we have form data (for editing) or when it's a new form */}
        {(isEditing && editingForm) || !isEditing ? (
          <FormBuilder
            key={id || 'new'} // Force re-render when switching between forms
            form={editingForm}
            onSave={handleSave}
            onCancel={handleCancel}
            embedded={false}
            lockedStatus={forceTaskUsageStatus ? 'task_usage' : undefined}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-muted-foreground">Carregando formulário...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormBuilderFullScreen;
