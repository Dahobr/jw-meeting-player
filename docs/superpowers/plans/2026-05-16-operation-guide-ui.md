# Refresh do Sistema de Ajuda (Guia de Operação na Área de Preview) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar um guia visual de operação na área de preview que aparece automaticamente quando nenhum item está selecionado, orientando o usuário passo a passo.

**Architecture:** O guia será um componente HTML/CSS injetado na área de preview existente. O `uiManager.js` será responsável por renderizar o conteúdo dinamicamente (baseado no modo do Zoom e no idioma), e o `app.js` controlará sua visibilidade com base no estado de reprodução.

**Tech Stack:** HTML5, CSS3 (Vanilla), JavaScript (ES6), Electron IPC.

---

### Task 1: Estrutura HTML e Estilos CSS

**Files:**
- Modify: `src/renderer/index.html`
- Modify: `src/renderer/main.css`

- [ ] **Step 1: Adicionar o container do guia no `index.html`**

Adicionar `<div id="operation-guide" class="operation-guide-container" style="display: none;"></div>` dentro de `#preview-area`, antes de `.preview-media-wrapper`.

```html
<!-- src/renderer/index.html -->
<div id="preview-area" class="preview-overlay" style="display: none;">
    <div id="preview-state-label" class="state-label"></div>
    <!-- Novo: Container do Guia -->
    <div id="operation-guide" class="operation-guide-container" style="display: none;"></div>
    
    <div class="preview-media-wrapper">
        <video id="preview-video" muted></video>
        <img id="preview-image" style="display: none;">
    </div>
    <!-- ... rest ... -->
</div>
```

- [ ] **Step 2: Adicionar estilos no `main.css`**

Adicionar os estilos baseados no design visual aprovado.

```css
/* src/renderer/main.css */
.operation-guide-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: #ffffff;
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;
    z-index: 5;
}

.guide-card {
    max-width: 600px;
    width: 100%;
    text-align: left;
}

.guide-header {
    text-align: center;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 20px;
    position: relative;
}

.guide-header h2 {
    color: var(--primary-color);
    margin: 0;
    font-size: 1.6rem;
}

.guide-mode-badge {
    position: absolute;
    top: 0; right: 0;
    background: var(--primary-color);
    color: white;
    font-size: 0.7rem;
    padding: 3px 8px;
    border-radius: 4px;
}

.guide-steps {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.guide-step {
    display: flex;
    align-items: center;
    gap: 15px;
    background: #f5f5f5;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
}

.guide-step.zoom-step {
    border-color: #e57c23;
    background: #fff9f0;
}

.guide-step-num {
    background: var(--primary-color);
    color: white;
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
}

.guide-step.zoom-step .guide-step-num {
    background: #e57c23;
}

.guide-step-content { flex: 1; }
.guide-step-title { font-weight: bold; font-size: 1.1rem; color: #222; }
.guide-step-desc { font-size: 0.9rem; color: #555; }

.guide-zoom-tag {
    font-size: 0.65rem;
    color: #e57c23;
    font-weight: bold;
    display: block;
    margin-bottom: 2px;
}

.guide-icon-box {
    font-size: 1.5rem;
    width: 50px;
    text-align: center;
}

.guide-play-mock {
    width: 32px; height: 32px;
    background: var(--primary-color);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
}
.guide-play-mock::after {
    content: '';
    width: 0; height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 10px solid white;
    margin-left: 3px;
}

.guide-attention {
    margin-top: 20px;
    background: #ffeded;
    border: 2px solid #d83b01;
    padding: 12px;
    border-radius: 8px;
    color: #d83b01;
    text-align: center;
}

.guide-attention b { display: block; margin-bottom: 4px; }
```

- [ ] **Step 3: Commit Task 1**
Run: `git add src/renderer/index.html src/renderer/main.css && git commit -m "feat: add HTML structure and CSS for operation guide"`

---

### Task 2: Lógica do Guia no `uiManager.js`

**Files:**
- Modify: `src/renderer/js/uiManager.js`

- [ ] **Step 1: Inicializar novos elementos no constructor**

```javascript
// src/renderer/js/uiManager.js
this.operationGuide = document.getElementById('operation-guide');
this.previewMediaWrapper = document.querySelector('.preview-media-wrapper');
```

- [ ] **Step 2: Implementar métodos de renderização e visibilidade**

```javascript
// src/renderer/js/uiManager.js (adicionar métodos)

    showOperationGuide(zoomMode) {
        this.hideHelp();
        if (window.electronAPI && window.electronAPI.toggleWebView) {
            window.electronAPI.toggleWebView(false);
        }

        this.previewArea.style.display = 'flex';
        this.operationGuide.style.display = 'flex';
        this.previewMediaWrapper.style.display = 'none';
        this.previewControls.style.display = 'none';
        if (this.stateLabel) this.stateLabel.style.display = 'none';

        this.renderOperationGuide(zoomMode);
    }

    hideOperationGuide() {
        this.operationGuide.style.display = 'none';
        this.previewMediaWrapper.style.display = 'flex';
        this.previewControls.style.display = 'flex';
        if (this.stateLabel) this.stateLabel.style.display = 'block';
    }

    renderOperationGuide(zoomMode) {
        const isAuto = zoomMode === 'auto';
        const modeText = isAuto ? 'Zoom Automático' : (zoomMode === 'semi' ? 'Zoom Semiautomático' : 'Zoom Manual');
        
        this.operationGuide.innerHTML = `
            <div class="guide-card">
                <div class="guide-header">
                    <h2>Guia de Operação</h2>
                    <span class="guide-mode-badge">Modo: ${modeText}</span>
                </div>
                <div class="guide-steps">
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
                            <div class="guide-step-desc">Clique no Play. O vídeo aparecerá na <b>2ª tela</b> e o Zoom será acionado.</div>
                        </div>
                        <div class="guide-icon-box"><div class="guide-play-mock"></div></div>
                    </div>
                    ${isAuto ? `
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
                            <span class="guide-zoom-tag">Na janela do Zoom (Apenas na 1ª vez)</span>
                            <div class="guide-step-title">Clique Duplo na Tela 2</div>
                            <div class="guide-step-desc">Dê um <b>clique duplo</b> no quadro da "Tela 2" para iniciar.</div>
                        </div>
                        <div class="guide-icon-box">🖱️🖱️</div>
                    </div>
                    ` : ''}
                </div>
                ${isAuto ? `
                <div class="guide-attention">
                    <b>⚠️ ATENÇÃO:</b>
                    Após a primeira configuração, o sistema fará os passos 4 e 5 <b>automaticamente</b>. 
                    <b>Não mexa no mouse</b> enquanto o Zoom estiver processando!
                </div>
                ` : ''}
            </div>
        `;
    }
```

- [ ] **Step 3: Ajustar `showPreview` e `hidePreview`**

```javascript
// src/renderer/js/uiManager.js

    showPreview(type, filePath, autoPlay = true) {
        // ... (at start of method)
        this.hideOperationGuide();
        // ...
    }

    hidePreview() {
        // ... (at start of method)
        this.hideOperationGuide();
        // ...
    }
```

- [ ] **Step 4: Commit Task 2**
Run: `git add src/renderer/js/uiManager.js && git commit -m "feat: implement guide rendering logic in UIManager"`

---

### Task 3: Integração no `app.js`

**Files:**
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Atualizar `updatePlaybackUI` para mostrar o guia quando parado**

```javascript
// src/renderer/js/app.js

    updatePlaybackUI() {
        // ... (existing logic)
        
        const isStopped = this.status === 'stopped';
        const hasMedia = !!this.currentMedia;
        const zoomMode = this.ui.zoomModeSelect ? this.ui.zoomModeSelect.value : 'auto';

        if (isStopped && !hasMedia) {
            this.ui.showOperationGuide(zoomMode);
        } else if (hasMedia) {
            this.ui.hideOperationGuide();
        }

        // ...
    }
```

- [ ] **Step 2: Atualizar guia ao mudar modo do Zoom**

```javascript
// src/renderer/js/app.js (in setupUICallbacks)
        if (this.ui.zoomModeSelect) {
            this.ui.zoomModeSelect.onchange = (e) => {
                const mode = e.target.value;
                this.ipc.updateConfig({ zoomMode: mode });
                this.updatePlaybackUI();
            };
        }
```

- [ ] **Step 3: Commit Task 3**
Run: `git add src/renderer/js/app.js && git commit -m "feat: integrate operation guide with app state"`
