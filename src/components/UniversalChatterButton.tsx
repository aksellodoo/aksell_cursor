import { ChatterAccess } from "./ChatterAccess";
import { useChatterNavigation } from "@/hooks/useChatterNavigation";

export const UniversalChatterButton = () => {
  const { detectCurrentRecord, hasCurrentRecord } = useChatterNavigation();
  
  // Only show if we're on a page with a detectable record
  if (!hasCurrentRecord()) {
    return null;
  }

  const currentRecord = detectCurrentRecord();
  if (!currentRecord) {
    return null;
  }

  return (
    <ChatterAccess
      recordType={currentRecord.recordType}
      recordId={currentRecord.recordId}
      recordName={currentRecord.recordName}
      variant="floating"
    />
  );
};