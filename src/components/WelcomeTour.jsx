import React, { useState, useEffect, useRef } from 'react';

// ─── Posição do elemento destacado ──────────────────────────────────────────
function getHighlightBox(highlight) {
  if (!highlight) return null;

  if (highlight === 'signal-editor') {
    const el = document.getElementById('tour-signal-editor');
    if (el) { const r = el.getBoundingClientRect(); return { top: r.top, left: r.left, width: r.width, height: r.height }; }
    return null;
  }
  if (highlight === 'connection-code') {
    const el = document.getElementById('tour-connection-code');
    if (el) { const r = el.getBoundingClientRect(); return { top: r.top, left: r.left, width: r.width, height: r.height }; }
    return null;
  }
  if (highlight === 'lock') {
    const btn = document.querySelector('.lock-btn-header');
    if (btn) { const r = btn.getBoundingClientRect(); return { top: r.top, left: r.left, width: r.width, height: r.height }; }
    return null;
  }
  const navMap = { signals: 0, chat: 1, partner: 2, perfil: 3 };
  if (navMap[highlight] !== undefined) {
    const btns = document.querySelectorAll('.app-nav button');
    const btn = btns[navMap[highlight]];
    if (btn) { const r = btn.getBoundingClientRect(); return { top: r.top, left: r.left, width: r.width, height: r.height }; }
  }
  return null;
}

// ─── Passos (sem o "Pronto!" – o modal faz esse papel) ──────────────────────
function buildSteps(hasPartner) {
  const steps = [
    { icon: '🦦', title: 'Olá! Bem-vindos!', description: 'Um cantinho só de vocês dois. Vou te mostrar rapidinho como funciona! 💚', highlight: null, tab: null, arrowDir: null },
    { icon: '⚡', title: 'Sinais', description: 'Toque em um sentimento para avisar seu amor como você está — sem precisar escrever nada.', highlight: 'signals', tab: 'signals', arrowDir: 'down' },
    { icon: '💬', title: 'Chat', description: 'Crie assuntos e troque mensagens organizadas. No tempo de vocês, com calma.', highlight: 'chat', tab: 'chat', arrowDir: 'down' },
    { icon: '🌿', title: 'Vida', description: hasPartner ? 'Veja o estado atual do seu amor e envie um carinho com um toque.' : 'Aqui você vincula seu app com o do seu amor. Compartilhe o seu código ou insira o dele!', highlight: 'partner', tab: 'partner', arrowDir: 'down' },
  ];

  if (!hasPartner) {
    steps.push({ icon: '🔗', title: 'Seu código de vínculo', description: 'Compartilhe esse código com seu parceiro — ou insira o código dele — para começarem a se conectar.', highlight: 'connection-code', tab: 'partner', arrowDir: 'up' });
  }

  steps.push(
    { icon: '🙋', title: 'Aba Eu', description: 'Configure seu nome, ícone favorito, tema de cores e PIN de segurança.', highlight: 'perfil', tab: 'perfil', arrowDir: 'down' },
    { icon: '✨', title: 'Personalizar Sinais', description: 'Toque aqui para criar ou editar seus próprios sentimentos com emojis e cores personalizadas!', highlight: 'signal-editor', tab: 'perfil', arrowDir: 'up' },
    { icon: '🔒', title: 'Bloquear', description: 'O cadeadinho no topo bloqueia o app sem sair da conta. Só o PIN ou a digital para voltar!', highlight: 'lock', tab: null, arrowDir: 'up' },
  );

  return steps;
}

// ─── Componente Principal ────────────────────────────────────────────────────
export function WelcomeTour({ onFinish, onTabChange, hasPartner = false }) {
  const TOUR_STEPS = buildSteps(hasPartner);

  const [step, setStep] = useState(0);            // passo atual do CARD
  const [displayStep, setDisplayStep] = useState(0); // passo visível no conteúdo (pode estar atrasado)
  const [cardFading, setCardFading] = useState(false); // controla fade do conteúdo
  const [highlight, setHighlight] = useState(null);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [exiting, setExiting] = useState(false);

  const current = TOUR_STEPS[displayStep];
  const isFirst = step === 0;
  const isLast = step === TOUR_STEPS.length - 1;

  // Atualiza a posição do spotlight 150ms após a troca de tab/passo
  useEffect(() => {
    const t = setTimeout(() => setHighlight(getHighlightBox(TOUR_STEPS[step]?.highlight)), 200);
    return () => clearTimeout(t);
  }, [step]);

  // ─── Avançar: mover spotlight PRIMEIRO, depois fade no conteúdo ──────────
  const goNext = () => {
    const next = step + 1;
    if (next > TOUR_STEPS.length - 1) {
      // Último passo → abrir modal
      setShowFinalModal(true);
      return;
    }

    // 1. Muda a aba imediatamente (spotlight começa a se mover)
    if (TOUR_STEPS[next].tab && onTabChange) onTabChange(TOUR_STEPS[next].tab);
    setStep(next);

    // 2. Fade out do conteúdo do card
    setCardFading(true);

    // 3. Após a transição do spotlight (400ms), fade in com novo conteúdo
    setTimeout(() => {
      setDisplayStep(next);
      setCardFading(false);
    }, 380);
  };

  // ─── Voltar: mesma lógica sincronizada ───────────────────────────────────
  const goPrev = () => {
    const prev = step - 1;
    if (prev < 0) return;

    if (TOUR_STEPS[prev].tab && onTabChange) onTabChange(TOUR_STEPS[prev].tab);
    setStep(prev);
    setCardFading(true);
    setTimeout(() => {
      setDisplayStep(prev);
      setCardFading(false);
    }, 380);
  };

  const handleFinish = () => {
    setExiting(true);
    setTimeout(() => { localStorage.setItem('tour_completed', 'true'); onFinish(); }, 280);
  };

  return (
    <div className={`tour-overlay ${exiting ? 'tour-exit' : ''}`}>

      {/* ── Modal final ─────────────────────────────────────────────── */}
      {showFinalModal && (
        <div className="tour-final-backdrop">
          <div className="tour-final-modal">
            <img src="/nosso_mascote_final.png" alt="Lontras" className="tour-final-mascot" />
            <h2 className="tour-final-title">{hasPartner ? 'Tudo pronto! 💚' : 'Quase lá! 🦦'}</h2>
            <p className="tour-final-desc">
              {hasPartner
                ? 'Ative as notificações na aba "Eu" para não perder nenhum sinal do seu amor. O cantinho de vocês está pronto!'
                : 'Assim que seu amor usar o código de vínculo, a aba Vida vai aparecer com os dados dele. O cantinho de vocês está quase pronto!'}
            </p>
            <button className="tour-final-btn" onClick={handleFinish}>Começar! 🎉</button>
          </div>
        </div>
      )}

      {/* ── Spotlight (se mover com CSS transition) ─────────────────── */}
      {!showFinalModal && highlight && (
        <div className="tour-spotlight" style={{ top: highlight.top - 6, left: highlight.left - 6, width: highlight.width + 12, height: highlight.height + 12 }} />
      )}

      {/* ── Setas ────────────────────────────────────────────────────── */}
      {!showFinalModal && TOUR_STEPS[step]?.arrowDir === 'down' && highlight && (
        <div className="tour-arrow" style={{ top: highlight.top - 38, left: highlight.left + highlight.width / 2 - 12 }}>↓</div>
      )}
      {!showFinalModal && TOUR_STEPS[step]?.arrowDir === 'up' && highlight && (
        <div className="tour-arrow" style={{ top: highlight.top + highlight.height + 8, left: highlight.left + highlight.width / 2 - 12 }}>↑</div>
      )}

      {/* ── Card compacto ─────────────────────────────────────────────── */}
      {!showFinalModal && (
        <div className="tour-card-compact">
          <div className={`tour-content ${cardFading ? 'tour-content-out' : 'tour-content-in'}`}>
            <div className="tour-top-row">
              <span className="tour-icon-sm">{current?.icon}</span>
              <div className="tour-text">
                <strong className="tour-title-sm">{current?.title}</strong>
                <p className="tour-desc-sm">{current?.description}</p>
              </div>
            </div>
          </div>

          <div className="tour-bottom-row">
            <div className="tour-progress-sm">
              {TOUR_STEPS.map((_, i) => (
                <div key={i} className={`tour-dot-sm ${i === step ? 'active' : i < step ? 'done' : ''}`} />
              ))}
            </div>
            <div className="tour-btns">
              {isFirst ? (
                <button className="tour-btn-skip" onClick={handleFinish}>Pular</button>
              ) : (
                <button className="tour-btn-skip" onClick={goPrev} disabled={cardFading}>←</button>
              )}
              <button className="tour-btn-next" onClick={goNext} disabled={cardFading}>
                {isLast ? 'Finalizar →' : 'Próximo →'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .tour-overlay {
          position: fixed; inset: 0; z-index: 9998;
          pointer-events: none;
          animation: tourFadeIn 0.25s ease-out;
        }
        .tour-overlay.tour-exit { animation: tourFadeOut 0.28s ease-out forwards; }
        @keyframes tourFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tourFadeOut { from { opacity: 1; } to { opacity: 0; } }

        /* Spotlight com transição suave de posição */
        .tour-spotlight {
          position: fixed; border-radius: 16px;
          border: 3px solid var(--color-primary);
          box-shadow: 0 0 0 4px rgba(82,121,111,0.2), 0 0 20px rgba(82,121,111,0.3);
          pointer-events: none; z-index: 9999;
          animation: spotlightPulse 1.8s ease-in-out infinite;
          transition: top 0.4s cubic-bezier(0.4,0,0.2,1),
                      left 0.4s cubic-bezier(0.4,0,0.2,1),
                      width 0.4s cubic-bezier(0.4,0,0.2,1),
                      height 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes spotlightPulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(82,121,111,0.2), 0 0 20px rgba(82,121,111,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(82,121,111,0.1), 0 0 28px rgba(82,121,111,0.4); }
        }

        /* Setas com transição de posição */
        .tour-arrow {
          position: fixed; font-size: 1.4rem; font-weight: 900;
          color: var(--color-primary); z-index: 9999; pointer-events: none;
          animation: arrowBounce 0.9s ease-in-out infinite;
          transition: top 0.4s cubic-bezier(0.4,0,0.2,1), left 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes arrowBounce {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }

        /* Card compacto */
        .tour-card-compact {
          position: fixed; bottom: 90px;
          left: 50%; transform: translateX(-50%);
          width: calc(100% - 32px); max-width: 440px;
          background: #fff; border-radius: 20px; padding: 14px 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.15), 0 0 0 1px var(--color-accent);
          display: flex; flex-direction: column; gap: 10px;
          pointer-events: all; z-index: 10000;
          animation: cardSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes cardSlideUp {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }

        /* Fade sincronizado do conteúdo do card */
        .tour-content { transition: opacity 0.18s ease, transform 0.18s ease; }
        .tour-content-out { opacity: 0; transform: translateY(5px); }
        .tour-content-in { opacity: 1; transform: translateY(0); }

        .tour-top-row { display: flex; gap: 10px; align-items: flex-start; }
        .tour-icon-sm { font-size: 1.8rem; line-height: 1; flex-shrink: 0; }
        .tour-text { display: flex; flex-direction: column; gap: 3px; }
        .tour-title-sm { font-size: 0.95rem; font-weight: 900; color: var(--text-primary); }
        .tour-desc-sm { font-size: 0.8rem; font-weight: 600; color: #666; line-height: 1.5; margin: 0; }

        .tour-bottom-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .tour-progress-sm { display: flex; gap: 5px; align-items: center; }
        .tour-dot-sm { width: 6px; height: 6px; border-radius: 50%; background: var(--color-accent); transition: all 0.3s; }
        .tour-dot-sm.active { background: var(--color-primary); width: 16px; border-radius: 3px; }
        .tour-dot-sm.done { background: var(--color-secondary); }

        .tour-btns { display: flex; gap: 7px; }
        .tour-btn-skip {
          padding: 8px 12px; border-radius: 11px;
          border: 1px solid var(--color-accent); background: var(--bg-primary);
          color: var(--color-secondary); font-weight: 700; font-size: 0.8rem; cursor: pointer;
        }
        .tour-btn-skip:disabled { opacity: 0.4; }
        .tour-btn-next {
          padding: 8px 14px; border-radius: 11px; border: none;
          background: var(--color-primary); color: #fff;
          font-weight: 800; font-size: 0.82rem; cursor: pointer; white-space: nowrap;
          transition: all 0.15s;
        }
        .tour-btn-next:disabled { opacity: 0.5; }
        .tour-btn-next:active { transform: scale(0.96); }

        /* ── Modal Glass Final ─────────────────────────────────── */
        .tour-final-backdrop {
          position: fixed; inset: 0; z-index: 10001;
          background: rgba(51, 65, 72, 0.5);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: tourFadeIn 0.35s ease-out;
          pointer-events: all;
        }
        .tour-final-modal {
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.7);
          border-radius: 36px; padding: 40px 28px 32px;
          width: 100%; max-width: 360px;
          text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 20px;
          box-shadow: 0 20px 60px rgba(51,65,72,0.2), 0 4px 20px rgba(0,0,0,0.08);
          animation: finalModalPop 0.45s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes finalModalPop {
          from { transform: scale(0.8) translateY(30px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .tour-final-mascot {
          width: 110px; height: 110px; object-fit: contain;
          filter: drop-shadow(0 8px 20px rgba(82,121,111,0.25));
          animation: mascotFloat 3s ease-in-out infinite;
        }
        @keyframes mascotFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        .tour-final-title { font-size: 1.6rem; font-weight: 900; color: var(--text-primary); letter-spacing: -0.02em; margin: 0; }
        .tour-final-desc { font-size: 0.92rem; font-weight: 600; color: #555; line-height: 1.65; margin: 0; }
        .tour-final-btn {
          width: 100%; padding: 20px; border-radius: 20px; border: none;
          background: var(--color-primary); color: #fff;
          font-weight: 900; font-size: 1.05rem; cursor: pointer;
          box-shadow: 0 8px 24px rgba(82,121,111,0.35);
          transition: all 0.2s cubic-bezier(0.175,0.885,0.32,1.275);
        }
        .tour-final-btn:active { transform: scale(0.96); }
      `}} />
    </div>
  );
}
