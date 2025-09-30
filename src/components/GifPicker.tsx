import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Picker simples: inserir GIF via URL por enquanto (integração com APIs pode ser adicionada depois)
export const GifPicker: React.FC<{ onInsert: (url: string) => void }>=({ onInsert })=>{
  const [url, setUrl] = useState("");
  return (
    <div className="w-72 p-3 space-y-2">
      <p className="text-sm text-muted-foreground">Cole o link do GIF (ex: .gif)</p>
      <Input placeholder="https://...gif" value={url} onChange={(e)=>setUrl(e.target.value)} className="h-9" />
      <div className="flex justify-end">
        <Button size="sm" onClick={()=>{ if(url) { onInsert(url); setUrl(""); }}}>Inserir GIF</Button>
      </div>
    </div>
  );
};

export default GifPicker;
