import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareRecordModal } from '@/components/ShareRecordModal';

interface ShareButtonProps {
  recordType: string;
  recordId: string;
  recordName: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showText?: boolean;
}

export const ShareButton = ({
  recordType,
  recordId,
  recordName,
  variant = 'outline',
  size = 'sm',
  className = "",
  showText = false
}: ShareButtonProps) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsShareModalOpen(true)}
        className={className}
      >
        <Share2 className="w-4 h-4 mr-1" />
        {showText && "Compartilhar"}
      </Button>

      <ShareRecordModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        recordType={recordType}
        recordId={recordId}
        recordName={recordName}
      />
    </>
  );
};