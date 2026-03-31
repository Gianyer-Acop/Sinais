-- 24.1: AJUSTAR RLS PARA COMUNICAÇÃO ENTRE PARCEIROS
-- Garantir que parceiros possam ver os sinais um do outro
CREATE POLICY "Partners can view shared signals" ON public.signals
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT partner_id FROM public.profiles WHERE id = user_id)
    );

-- Garantir que parceiros possam ver os tipos de sinais (botões) um do outro
CREATE POLICY "Partners can view shared signal types" ON public.signal_types
    FOR SELECT USING (
        auth.uid() = created_by OR 
        auth.uid() = partner_id
    );

-- Garantir que parceiros possam ler e enviar mensagens um para o outro
CREATE POLICY "Partners can manage shared messages" ON public.messages
    FOR ALL USING (
        auth.uid() = sender_id OR 
        auth.uid() IN (SELECT partner_id FROM public.profiles WHERE id = sender_id)
    );

-- Garantir que parceiros possam ver as conversas um do outro
CREATE POLICY "Partners can view shared conversations" ON public.conversations
    FOR ALL USING (
        auth.uid() = created_by OR 
        auth.uid() = partner_id
    );

-- Garantir que notificações possam ser enviadas entre parceiros
DROP POLICY IF EXISTS "Users can insert notifications for others" ON public.notifications;
CREATE POLICY "Users can insert notifications for others" ON public.notifications
    FOR INSERT WITH CHECK (true); -- Permitir envio para qualquer um (o App filtra o destinatário)
