import { useEffect, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Card } from "@/components/ui/card";

// Import TinyMCE and the plugins/themes so Vite bundles them
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/table";
import "tinymce/plugins/image";
import "tinymce/plugins/code";
// Import skins so the editor UI and content are styled when bundled
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/skins/content/default/content.min.css";

interface EmailHtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
}

// Editor TinyMCE configurado para preservar HTML de email (tabelas, estilos inline, etc.)
const EmailHtmlEditor = ({
  value,
  onChange,
  placeholder = "Crie sua assinatura...",
  disabled = false,
  height = 520,
}: EmailHtmlEditorProps) => {
  const editorRef = useRef<any>(null);

  useEffect(() => {
    // Sincronizar valor externo quando mudar (ex: troca de assinatura)
    if (editorRef.current && typeof value === "string") {
      const editor = editorRef.current as any;
      const current = editor.getContent({ format: "html" });
      if (current !== value) editor.setContent(value || "");
    }
  }, [value]);

  return (
    <Card className="p-0">
      <Editor
        onInit={(_, editor) => (editorRef.current = editor)}
        disabled={disabled}
        value={value}
        onEditorChange={(content) => onChange(content)}
        init={{
          height,
          menubar: false,
          branding: false,
          statusbar: true,
          toolbar_sticky: true,
          toolbar_mode: "wrap",
          // Use bundled CSS instead of loading from TinyMCE skins path
          skin: false,
          content_css: false,
          
          // Não forçar <p> automaticamente para não quebrar tabelas/HTML colado
          forced_root_block: "",
          // Preservar estilos inline e atributos ao colar
          paste_webkit_styles: "all",
          paste_retain_style_properties: "all",
          paste_merge_formats: true,
          keep_styles: true,
          // Permitir praticamente qualquer elemento/atributo (controle de segurança é feito na visualização com DOMPurify)
          valid_elements: "*[*]",
          valid_children: "+body[style],+table[tbody|thead|tfoot|tr|td|th]",
          // Plugins necessários para edição básica e tabelas
          plugins: [
            "advlist",
            "autolink",
            "link",
            "lists",
            "table",
            "image",
            "code"
          ],
          // Fontes e tamanhos padrão para emails
          font_formats: "Arial=arial,helvetica,sans-serif; Helvetica=helvetica,arial,sans-serif; Calibri=Calibri,Candara,Segoe,\"Segoe UI\",Optima,Arial,sans-serif; Verdana=Verdana,Geneva,sans-serif; Tahoma=Tahoma,Geneva,sans-serif; Georgia=Georgia,serif; Times New Roman=\"Times New Roman\",Times,serif",
          fontsize_formats: "8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 24pt 36pt",
          // Melhorias de link para segurança/usabilidade
          link_default_target: "_blank",
          link_default_protocol: "https",
          link_assume_external_targets: "https",
          toolbar:
            "undo redo | formatselect fontselect fontsizeselect | bold italic underline strikethrough forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent blockquote | table link image | removeformat | code",
          // Tema consistente com o app
          content_style: `
            :root { color-scheme: light dark; }
            body { background: transparent; color: hsl(var(--foreground)); font-family: Arial, Helvetica, sans-serif; line-height: 1.35; }
            table { width: auto; border-collapse: collapse; }
            td, th { border: 1px solid hsl(var(--border)); padding: 4px 6px; }
            img { max-width: 100%; height: auto; }
            a { color: hsl(var(--primary)); }
            blockquote { border-left: 3px solid hsl(var(--border)); margin: 0; padding-left: 8px; color: hsl(var(--muted-foreground)); }
          `,
          placeholder,
        }}
      />
    </Card>
  );
};

export default EmailHtmlEditor;
