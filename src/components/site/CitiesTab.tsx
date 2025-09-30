
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, MapPin, Activity, RefreshCw } from "lucide-react";
import { CityFormModal } from "./CityFormModal";
import SiteCitiesCSVImportModal from "./SiteCitiesCSVImportModal";
import { CitiesList } from "./CitiesList";
import { DistanceCalculationModal } from "./DistanceCalculationModal";
import { DistanceProgressModal } from "./DistanceProgressModal";
import { useCityDistanceCalculation } from "@/hooks/useCityDistanceCalculation";

export function CitiesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDistanceModalOpen, setIsDistanceModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { startCalculation, isStarting, isJobRunning, currentJob } = useCityDistanceCalculation();

  // Auto-open progress modal when there's an active job
  useEffect(() => {
    if (currentJob && isJobRunning) {
      setIsProgressModalOpen(true);
    }
  }, [currentJob, isJobRunning]);

  const handleStartDistanceCalculation = (mode: 'fill_empty' | 'overwrite' | 'geocode_non_matrix') => {
    startCalculation.mutate({ mode }, {
      onSuccess: (data) => {
        // Only open progress modal if a job was actually created
        if (data.jobId) {
          setIsProgressModalOpen(true);
        }
        setRefreshKey(prev => prev + 1);
      }
    });
  };

  const handleDistanceButtonClick = () => {
    if (isJobRunning) {
      // If job is running, open progress modal directly
      setIsProgressModalOpen(true);
    } else {
      // If no job, open confirmation modal
      setIsDistanceModalOpen(true);
    }
  };

  const handleRefreshList = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex gap-2 justify-start">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Cidade
        </Button>
        <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Importar CSV
        </Button>
        <Button 
          variant="outline" 
          onClick={handleDistanceButtonClick}
        >
          {isJobRunning ? (
            <>
              <Activity className="h-4 w-4 mr-2" />
              Ver progresso / Cancelar
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Calcular Distância em KM até Indaiatuba, SP
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleRefreshList}
          title="Atualizar lista de cidades"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Lista de Cidades */}
      <CitiesList refreshKey={refreshKey} />

      {/* Modal de Cadastro */}
      <CityFormModal 
        open={isModalOpen} 
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setRefreshKey(prev => prev + 1);
          }
        }}
      />

      {/* Modal de Importação CSV */}
      <SiteCitiesCSVImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImported={() => {
          setRefreshKey(prev => prev + 1);
        }}
      />

      {/* Modal de Confirmação de Distância */}
      <DistanceCalculationModal
        open={isDistanceModalOpen}
        onOpenChange={setIsDistanceModalOpen}
        onConfirm={handleStartDistanceCalculation}
        isStarting={isStarting}
      />

      {/* Modal de Progresso */}
      <DistanceProgressModal
        open={isProgressModalOpen}
        onOpenChange={(open) => {
          setIsProgressModalOpen(open);
          if (!open) {
            // Refresh list when modal closes
            setRefreshKey(prev => prev + 1);
          }
        }}
      />
    </div>
  );
}
