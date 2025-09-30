
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MicrosoftAccount {
  id: string;
  user_id: string;
  ms_account_id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export const useMicrosoftAccount = (userId?: string) => {
  const [account, setAccount] = useState<MicrosoftAccount | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAccount = async () => {
    if (!userId) {
      setAccount(null);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("microsoft_accounts")
      .select("*")
      .eq("user_id", userId)
      .limit(1);

    if (error) {
      console.error("Error fetching microsoft account:", error);
      setAccount(null);
    } else {
      setAccount(data && data.length > 0 ? (data[0] as any) : null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    account,
    loading,
    refresh: fetchAccount,
  };
};
