window.templates = {
    renderOperationGuide(zoomMode) {
        const isAuto = zoomMode === 'auto';
        const isSemi = zoomMode === 'semi';
        const isManual = zoomMode === 'off';
        const modeText = isAuto ? 'Zoom Automático' : (isSemi ? 'Zoom Semiautomático' : 'Zoom Manual');

        return `
            <div class="guide-card">
                <div class="guide-header">
                    <h2>Guia de Operação</h2>
                    <span class="guide-mode-badge">Modo: ${modeText}</span>
                </div>
                <div class="guide-steps">
                    ${!isManual ? `
                    <div class="guide-step">
                        <div class="guide-step-num">0</div>
                        <div class="guide-step-content">
                            <div class="guide-step-title">Configurar Atalho Global</div>
                            <div class="guide-step-desc">
                                No Zoom (Configurações > Atalhos do teclado):<br>
                                Procure <b>Iniciar/interromper compartilhamento de tela</b> e ative <b>Atalho global</b>.
                            </div>
                        </div>
                        <div class="guide-icon-box">⚙️</div>
                    </div>` : ''}
                    <div class="guide-step">
                        <div class="guide-step-num">1</div>
                        <div class="guide-step-content">
                            <div class="guide-step-title">Preparar Playlist</div>
                            <div class="guide-step-desc"><b>Crie e/ou escolha</b> uma playlist na barra lateral.</div>
                        </div>
                        <div class="guide-icon-box">📋</div>
                    </div>
                    <div class="guide-step">
                        <div class="guide-step-num">2</div>
                        <div class="guide-step-content">
                            <div class="guide-step-title">Selecionar Mídia (Standby)</div>
                            <div class="guide-step-desc">Clique no item. Ele ficará pronto, mas <b>não aparecerá</b> na TV ainda.</div>
                        </div>
                        <div class="guide-icon-box">🖱️</div>
                    </div>
                    <div class="guide-step">
                        <div class="guide-step-num">3</div>
                        <div class="guide-step-content">
                            <div class="guide-step-title">Iniciar Reprodução</div>
                            <div class="guide-step-desc">Clique no <b>Reproduzir</b>. O vídeo aparecerá na <b>2ª tela</b> ${!isAuto ? 'e você deve compartilhar pelo Zoom manualmente.' : 'e o Zoom será acionado.'}</div>
                        </div>
                        <div class="guide-icon-box"><div class="guide-play-mock"></div></div>
                    </div>
                    ${(isAuto || isSemi) ? `
                    <div class="guide-step zoom-step">
                        <div class="guide-step-num">4</div>
                        <div class="guide-step-content">
                            <span class="guide-zoom-tag">Na janela do Zoom (Apenas na 1ª vez)</span>
                            <div class="guide-step-title">Marcar "Otimizar"</div>
                            <div class="guide-step-desc">Marque <b>"Otimizar para clipe de vídeo"</b> no Zoom.</div>
                        </div>
                        <div class="guide-icon-box">✅</div>
                    </div>
                    <div class="guide-step zoom-step">
                        <div class="guide-step-num">5</div>
                        <div class="guide-step-content">
                            <span class="guide-zoom-tag">${isAuto ? 'Na janela do Zoom (Apenas na 1ª vez)' : 'Na janela do Zoom (Sempre)'}</span>
                            <div class="guide-step-title">Clique Duplo na Tela 2</div>
                            <div class="guide-step-desc">Dê um <b>clique duplo</b> no quadro da "Tela 2" para iniciar.</div>
                        </div>
                        <div class="guide-icon-box">🖱️🖱️</div>
                    </div>
                    ` : ''}
                </div>
                ${isAuto ? `
                <div class="guide-attention" style="text-align: left;">
                    <b style="display: block; text-align: center;">⚠️ ATENÇÃO</b>
                    <ul style="padding-left: 20px; margin: 10px 0 0 0;">
                        <li>Estes passos (4 e 5) são necessários apenas no primeiro uso.</li>
                        <li>A partir da segunda vez, o sistema assume o controle automaticamente.</li>
                        <li>Não mexa no mouse durante o processamento!</li>
                    </ul>
                </div>
                ` : ''}
            </div>
        `;
    }
};
