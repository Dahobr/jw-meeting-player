/**
 * tutorialManager.js
 * Manages the hierarchical interactive tutorial overlay workflow.
 */

const tutorialManager = {
    // UI elements cache
    elements: {},

    // Hierarchical structure: Sections contain Steps
    // Sections use numeric IDs as requested
    sections: [
        {
            id: 0,
            title: "Bem-vindo ao JW Meeting Player",
            description: "Este tutorial ajudará você na <b>configuração inicial</b> e no aprendizado de como <b>operar</b> o aplicativo para a sua reunião de forma simples e rápida.",
            steps: []
        },
        {
            id: 1,
            title: "Integração com o Zoom",
            description: "O aplicativo oferece três formas de interagir com o Zoom, que você pode selecionar no <b>canto superior direito</b> da tela.",
            steps: [
                { 
                    title: "Escolha o Melhor Modo", 
                    content: `<ul style="text-align: left; list-style-type: none; padding: 0; margin: 0;">
                        <li style="margin-bottom: 10px;"><b>• Manual:</b> Você controla tudo manualmente no Zoom.</li>
                        <li style="margin-bottom: 10px;"><b>• Semiautomático:</b> O app prepara a mídia e você inicia a partilha.</li>
                        <li style="margin-bottom: 10px;"><b>• Automático:</b> (Recomendado) O app faz tudo por você de forma automática.</li>
                    </ul>`, 
                    action: null 
                }
            ]
        },
        {
            id: 2,
            title: "Configuração do Zoom",
            description: "Para que a automação funcione, precisamos ajustar algumas configurações dentro do próprio Zoom.",
            steps: [
                { title: "Abrir Configurações", content: "Clique no botão abaixo para abrir a tela de <b>configurações</b> do seu aplicativo Zoom.", action: "open-zoom-settings" },
                { title: "Atalho Global (Alt+S)", content: "Nas configurações de 'Atalhos de Teclado' do Zoom, marque o <b>Alt+S</b> como <b>'Atalho Global'</b> para garantir o controle fora da janela do Zoom.", action: null }
            ]
        },
        {
            id: 3,
            title: "Guia de Operação",
            description: "Agora que o Zoom está pronto, vamos aprender a usar as principais funções do aplicativo.",
            steps: [
                { title: "Criar Playlists", content: "Use o botão <b>'+'</b> no painel esquerdo para organizar suas reuniões por listas.", action: null },
                { title: "Importar Arquivos", content: "Arraste seus vídeos e imagens ou use o botão <b>'Importar'</b> para adicioná-los à lista.", action: null },
                { title: "Controle de Reprodução", content: "Clique em um item para prepará-lo e use os controles do <b>rodapé</b> para exibir o conteúdo para a congregação.", action: null }
            ]
        }
    ],

    currentSectionIdx: 0,
    currentStepIdx: -1, // -1 means we are showing the Section Intro

    /**
     * Initializes the tutorial system, loading UI and caching DOM elements.
     */
    init: async () => {
        const response = await fetch('tutorial.html');
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'tutorial.css';
        document.head.appendChild(link);

        // Cache DOM elements
        tutorialManager.elements = {
            overlay: document.getElementById('tutorial-overlay'),
            title: document.getElementById('tutorial-title'),
            content: document.getElementById('tutorial-content'),
            actionBtn: document.getElementById('tutorial-action-btn'),
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            btnSkip: document.getElementById('btn-skip'),
            checkNoShow: document.getElementById('check-no-show'),
            noShowLabel: document.querySelector('label[for="check-no-show"]') || document.querySelector('label')
        };

        // Attach event listeners
        tutorialManager.elements.btnNext.onclick = () => tutorialManager.next();
        tutorialManager.elements.btnPrev.onclick = () => tutorialManager.prev();
        tutorialManager.elements.btnSkip.onclick = () => tutorialManager.skipSection();
        tutorialManager.elements.actionBtn.onclick = () => tutorialManager.performAction();
        
        // Localize fixed labels
        tutorialManager.elements.btnPrev.textContent = "Voltar";
        tutorialManager.elements.btnSkip.textContent = "Pular";
        if (tutorialManager.elements.noShowLabel) {
            tutorialManager.elements.noShowLabel.childNodes[1].textContent = " Não mostrar novamente";
        }

        tutorialManager.render();
    },

    /**
     * Renders the current tutorial state (Section Intro or specific Step).
     */
    render: () => {
        const section = tutorialManager.sections[tutorialManager.currentSectionIdx];
        const el = tutorialManager.elements;
        const isIntro = (tutorialManager.currentStepIdx === -1);
        const isFirstScreen = (tutorialManager.currentSectionIdx === 0 && tutorialManager.currentStepIdx === -1);

        if (isIntro) {
            // Render Section Introduction
            el.title.innerHTML = section.title;
            el.content.innerHTML = section.description;
            el.actionBtn.classList.add('hidden');
            // Show Skip only on Intro, BUT hide it on the very first screen
            el.btnSkip.classList.toggle('hidden', isFirstScreen);
        } else {
            // Render Specific Step
            const step = section.steps[tutorialManager.currentStepIdx];
            el.title.innerHTML = step.title;
            el.content.innerHTML = step.content;
            el.btnSkip.classList.add('hidden'); // Hide Skip during steps

            if (step.action) {
                el.actionBtn.textContent = "Abrir Configurações do Zoom";
                el.actionBtn.classList.remove('hidden');
            } else {
                el.actionBtn.classList.add('hidden');
            }
        }

        // Navigation state logic
        // Hide Voltar on the first screen entirely instead of just disabling it
        el.btnPrev.classList.toggle('hidden', isFirstScreen);
        el.btnPrev.disabled = isFirstScreen;
        
        const isLastSection = (tutorialManager.currentSectionIdx === tutorialManager.sections.length - 1);
        const isLastStep = (section.steps.length > 0 && tutorialManager.currentStepIdx === section.steps.length - 1);
        el.btnNext.textContent = (isLastSection && (isLastStep || section.steps.length === 0)) ? "Finalizar" : "Próximo";

        // "Don't show again" only on the very first screen
        if (el.noShowLabel) {
            el.noShowLabel.classList.toggle('hidden', !isFirstScreen);
        }
    },

    /**
     * Advances to the next state (Step or next Section).
     */
    next: () => {
        const section = tutorialManager.sections[tutorialManager.currentSectionIdx];
        
        if (tutorialManager.currentStepIdx < section.steps.length - 1) {
            // Go to next step in current section
            tutorialManager.currentStepIdx++;
        } else {
            // Move to next section intro
            if (tutorialManager.currentSectionIdx < tutorialManager.sections.length - 1) {
                tutorialManager.currentSectionIdx++;
                tutorialManager.currentStepIdx = -1;
            } else {
                tutorialManager.finish();
                return;
            }
        }
        tutorialManager.render();
    },

    /**
     * Returns to the previous state.
     */
    prev: () => {
        if (tutorialManager.currentStepIdx > -1) {
            // Go back to intro or previous step
            tutorialManager.currentStepIdx--;
        } else {
            // Go back to the last step of the previous section
            if (tutorialManager.currentSectionIdx > 0) {
                tutorialManager.currentSectionIdx--;
                const prevSection = tutorialManager.sections[tutorialManager.currentSectionIdx];
                tutorialManager.currentStepIdx = prevSection.steps.length - 1;
            }
        }
        tutorialManager.render();
    },

    /**
     * Skips the current section and moves to the next section intro.
     */
    skipSection: () => {
        if (tutorialManager.currentSectionIdx < tutorialManager.sections.length - 1) {
            tutorialManager.currentSectionIdx++;
            tutorialManager.currentStepIdx = -1;
            tutorialManager.render();
        } else {
            tutorialManager.finish();
        }
    },

    /**
     * Finishes the tutorial and saves preferences.
     */
    finish: () => {
        if (tutorialManager.elements.checkNoShow && tutorialManager.elements.checkNoShow.checked) {
            tutorialManager.setSkipped(true);
        }
        tutorialManager.hide();
        // Reset state for next time (since user said "start from beginning")
        tutorialManager.currentSectionIdx = 0;
        tutorialManager.currentStepIdx = -1;
    },

    /**
     * Executes actions.
     */
    performAction: async () => {
        const section = tutorialManager.sections[tutorialManager.currentSectionIdx];
        const step = section.steps[tutorialManager.currentStepIdx];
        if (step && step.action === 'open-zoom-settings') {
            await window.electronAPI.openZoomSettings();
        }
    },

    show: () => tutorialManager.elements.overlay.classList.remove('hidden'),
    hide: () => tutorialManager.elements.overlay.classList.add('hidden'),
    isSkipped: () => localStorage.getItem('tutorial-skipped') === 'true',
    setSkipped: (skipped) => localStorage.setItem('tutorial-skipped', skipped)
};

export default tutorialManager;
