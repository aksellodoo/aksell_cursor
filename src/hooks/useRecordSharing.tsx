import { useState, useEffect } from 'react';
import { useSharedRecords } from '@/hooks/useSharedRecords';

export const useRecordSharing = (recordType: string, recordId: string) => {
  const { sharedByMe, sharedWithMe, checkSharedAccess } = useSharedRecords();
  const [isShared, setIsShared] = useState(false);
  const [sharedCount, setSharedCount] = useState(0);
  const [hasSharedAccess, setHasSharedAccess] = useState(false);

  useEffect(() => {
    // Check if this record is shared by me
    const myShares = sharedByMe.filter(share => 
      share.record_type === recordType && share.record_id === recordId
    );
    setIsShared(myShares.length > 0);
    setSharedCount(myShares.length);

    // Check if I have shared access to this record
    const checkAccess = async () => {
      const hasAccess = await checkSharedAccess(recordType, recordId);
      setHasSharedAccess(hasAccess);
    };
    
    checkAccess();
  }, [recordType, recordId, sharedByMe, sharedWithMe, checkSharedAccess]);

  return {
    isShared,
    sharedCount,
    hasSharedAccess
  };
};