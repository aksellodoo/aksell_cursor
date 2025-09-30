
-- 1) Tabela para conteúdos públicos do site (documentos como Política de Privacidade)
CREATE TABLE IF NOT EXISTS public.site_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,                         -- exemplo: 'privacy-policy'
  locale text NOT NULL DEFAULT 'pt',          -- exemplo: 'pt', 'en'
  title text NOT NULL,
  content_html text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_by uuid NULL,
  updated_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice único para identificar documentos por slug+locale
CREATE UNIQUE INDEX IF NOT EXISTS site_documents_slug_locale_idx
  ON public.site_documents (slug, locale);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_site_documents_updated_at ON public.site_documents;
CREATE TRIGGER set_site_documents_updated_at
BEFORE UPDATE ON public.site_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 2) RLS: leitura pública somente se publicado, e gestão por admin/diretor
ALTER TABLE public.site_documents ENABLE ROW LEVEL SECURITY;

-- Leitura pública de documentos publicados (inclui usuários anônimos)
DROP POLICY IF EXISTS "Public can view published site documents" ON public.site_documents;
CREATE POLICY "Public can view published site documents"
  ON public.site_documents
  FOR SELECT
  USING (is_published = true);

-- Admins/diretores podem ver tudo
DROP POLICY IF EXISTS "Admins/directors can view all site documents" ON public.site_documents;
CREATE POLICY "Admins/directors can view all site documents"
  ON public.site_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'director')
    )
  );

-- Admins/diretores podem inserir
DROP POLICY IF EXISTS "Admins/directors can insert site documents" ON public.site_documents;
CREATE POLICY "Admins/directors can insert site documents"
  ON public.site_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'director')
    )
  );

-- Admins/diretores podem atualizar
DROP POLICY IF EXISTS "Admins/directors can update site documents" ON public.site_documents;
CREATE POLICY "Admins/directors can update site documents"
  ON public.site_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'director')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'director')
    )
  );

-- Admins/diretores podem excluir
DROP POLICY IF EXISTS "Admins/directors can delete site documents" ON public.site_documents;
CREATE POLICY "Admins/directors can delete site documents"
  ON public.site_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'director')
    )
  );

-- 3) Seed inicial: Política de Privacidade (PT)
INSERT INTO public.site_documents (slug, locale, title, content_html, is_published, version)
VALUES (
  'privacy-policy',
  'pt',
  'Política de Privacidade',
  $$<h1>📄 Política de Privacidade</h1>
  <h2>1. Introdução</h2>
  <p>A AKSELL NUTRITION LTDA valoriza a privacidade e a proteção dos dados pessoais de seus visitantes e usuários. Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos e protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).</p>
  <p>Ao acessar nosso site e/ou ao utilizar nossos formulários ou nossos serviços, você concorda com os termos descritos nesta política.</p>
  <hr />
  <h2>2. Dados Coletados</h2>
  <p>Podemos coletar as seguintes informações:</p>
  <ul>
    <li><strong>Dados de identificação pessoal:</strong> nome, e-mail, telefone, empresa, cargo, site da empresa.</li>
    <li><strong>Dados de navegação e cookies:</strong> endereço IP, navegador, páginas acessadas, tempo de permanência, preferências de navegação.</li>
    <li><strong>Dados fornecidos em formulários:</strong> informações necessárias para solicitação de orçamento, contato, cadastro ou outras interações.</li>
  </ul>
  <hr />
  <h2>3. Finalidade da Coleta</h2>
  <p>Os dados são utilizados para:</p>
  <ul>
    <li>Responder solicitações de contato e orçamentos;</li>
    <li>Disponibilizar acesso a serviços ou materiais solicitados;</li>
    <li>Melhorar a experiência de navegação no site;</li>
    <li>Enviar comunicações institucionais, promocionais ou personalizadas, sempre respeitando sua opção de consentimento;</li>
    <li>Cumprir obrigações legais e regulatórias.</li>
  </ul>
  <hr />
  <h2>4. Cookies</h2>
  <p>Utilizamos cookies e tecnologias semelhantes para otimizar sua experiência.</p>
  <p><em>Exemplo de aviso:</em> “Utilizamos cookies para melhorar sua experiência de navegação, veicular anúncios ou conteúdo personalizado e analisar nosso tráfego. Ao clicar em ‘Aceitar todos’, você concorda com o uso de cookies. Você pode gerenciar suas preferências de cookies a qualquer momento em seu navegador ou em nosso painel de configuração (quando disponível).”</p>
  <hr />
  <h2>5. Compartilhamento de Dados</h2>
  <p>Seus dados pessoais não serão vendidos. Podem ser compartilhados apenas com:</p>
  <ul>
    <li>Fornecedores e parceiros necessários para execução dos serviços;</li>
    <li>Autoridades públicas, quando exigido por lei.</li>
  </ul>
  <hr />
  <h2>6. Direitos do Titular (LGPD – Art. 18)</h2>
  <p>Você, enquanto titular de dados, possui o direito de:</p>
  <ul>
    <li>Confirmar se tratamos seus dados;</li>
    <li>Acessar os dados pessoais que possuímos sobre você;</li>
    <li>Solicitar correção de dados incompletos ou desatualizados;</li>
    <li>Solicitar exclusão de dados pessoais (exceto quando a lei exigir sua manutenção);</li>
    <li>Revogar o consentimento a qualquer momento;</li>
    <li>Solicitar portabilidade dos dados para outro fornecedor de serviço.</li>
  </ul>
  <p>Para exercer seus direitos, entre em contato pelo e-mail: <a href="mailto:contato@empresa.com">contato@empresa.com</a>.</p>
  <hr />
  <h2>7. Segurança e Armazenamento</h2>
  <p>Adotamos medidas técnicas e organizacionais para proteger seus dados contra acessos não autorizados, destruição, perda ou alteração. Os dados são armazenados em servidores seguros e apenas pelo tempo necessário para cumprir as finalidades informadas.</p>
  <hr />
  <h2>8. Base Legal</h2>
  <p>O tratamento dos dados pessoais é realizado com fundamento em:</p>
  <ul>
    <li>Consentimento do titular (art. 7º, I);</li>
    <li>Execução de contratos e procedimentos preliminares (art. 7º, V);</li>
    <li>Cumprimento de obrigação legal ou regulatória (art. 7º, II);</li>
    <li>Legítimo interesse (art. 7º, IX), sempre respeitando os direitos e liberdades do titular.</li>
  </ul>
  <hr />
  <h2>9. Alterações na Política</h2>
  <p>Reservamo-nos o direito de alterar esta Política de Privacidade a qualquer momento, sendo as atualizações publicadas em nosso site/app. Recomendamos consulta periódica.</p>
  <hr />
  <h2>10. Contato</h2>
  <p>Em caso de dúvidas, solicitações ou reclamações relacionadas à privacidade e proteção de dados, entre em contato com nosso Encarregado de Dados (DPO) pelo e-mail: <a href="mailto:dpo@aksell.com.br">dpo@aksell.com.br</a>.</p>
  $$,
  true,
  1
)
ON CONFLICT (slug, locale) DO NOTHING;
