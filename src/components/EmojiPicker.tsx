import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const DEFAULT_EMOJIS = [
  "😀","😁","😂","🤣","😃","😄","😅","😊","😍","😘","😜","🤩","🤔","😎","😇","🙃","😉","🤗","🤝","👍","👎","👏","🙏","🔥","✨","🎉","✅","❌","💡","📌","📎","📧","📅","🕒","📞","💬","📈","📊","⚠️","❗","💪","🏆","💼","🧠","📝"
];

export const EmojiPicker: React.FC<{ onSelect: (emoji: string) => void }>=({ onSelect })=>{
  const [q, setQ] = useState("");
  const list = useMemo(()=>{
    if(!q.trim()) return DEFAULT_EMOJIS;
    return DEFAULT_EMOJIS.filter(e=> e.includes(q));
  },[q]);

  return (
    <div className="w-64 p-2">
      <Input placeholder="Pesquisar emoji..." value={q} onChange={(e)=>setQ(e.target.value)} className="mb-2 h-8" />
      <ScrollArea className="h-48">
        <div className="grid grid-cols-8 gap-2">
          {list.map((e)=> (
            <button key={e} className="text-xl hover:scale-110 transition-bounce" onClick={()=>onSelect(e)} aria-label={`Inserir ${e}`}>
              {e}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default EmojiPicker;
