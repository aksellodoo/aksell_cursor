-- Create conversation types enum
CREATE TYPE public.ai_conversation_type AS ENUM ('gestao_documentos', 'geral');

-- Create ai_conversations table
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  conversation_type ai_conversation_type NOT NULL DEFAULT 'geral',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scope JSONB, -- For storing document/folder/department context
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- Create ai_conversation_messages table
CREATE TABLE public.ai_conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB, -- For storing document sources
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view own conversations and subordinates"
ON public.ai_conversations
FOR SELECT
USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.id = auth.uid() 
    AND p2.id = ai_conversations.created_by
    AND p1.department_id = p2.department_id
    AND p1.role IN ('admin', 'director', 'hr')
  )
);

CREATE POLICY "Users can create own conversations"
ON public.ai_conversations
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own conversations"
ON public.ai_conversations
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete own conversations"
ON public.ai_conversations
FOR DELETE
USING (created_by = auth.uid());

-- RLS Policies for ai_conversation_messages
CREATE POLICY "Users can view messages of accessible conversations"
ON public.ai_conversation_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = ai_conversation_messages.conversation_id
    AND (
      c.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p1, profiles p2
        WHERE p1.id = auth.uid() 
        AND p2.id = c.created_by
        AND p1.department_id = p2.department_id
        AND p1.role IN ('admin', 'director', 'hr')
      )
    )
  )
);

CREATE POLICY "Users can create messages in own conversations"
ON public.ai_conversation_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_conversations c
    WHERE c.id = ai_conversation_messages.conversation_id
    AND c.created_by = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_ai_conversations_created_by ON public.ai_conversations(created_by);
CREATE INDEX idx_ai_conversations_type ON public.ai_conversations(conversation_type);
CREATE INDEX idx_ai_conversations_updated_at ON public.ai_conversations(updated_at DESC);
CREATE INDEX idx_ai_conversation_messages_conversation_id ON public.ai_conversation_messages(conversation_id);
CREATE INDEX idx_ai_conversation_messages_created_at ON public.ai_conversation_messages(created_at);

-- Add trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_ai_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_conversation_updated_at();