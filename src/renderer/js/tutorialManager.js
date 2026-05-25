const tutorialManager = {
    steps: [
        {
            title: "Bem-vindo ao JW Meeting Player",
            content: "Este guia ajudará você a configurar o aplicativo para sua reunião.",
            action: null
        },
        {
            title: "Modos do Zoom",
            content: "Você pode escolher entre: Manual, Semiautomático e Automático. O Automático é o mais recomendado.",
            action: null
        },
        {
            title: "Configuração do Zoom",
            content: "Precisamos abrir as configurações do Zoom para garantir que tudo funcione corretamente.",
            action: "open-zoom-settings"
        },
        {
            title: "Atalho Global (Alt+S)",
            content: "Configure o atalho Alt+S no Zoom como global para permitir controle rápido durante a reunião.",
            action: null
        },
        {
            title: "Guia de Operação",
            content: "Agora, vamos aprender a criar playlists e controlar a reprodução.",
            action: null
        }
    ],
    currentStep: 0,
    init: async () => {
        const response = await fetch('tutorial.html');
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'tutorial.css';
        document.head.appendChild(link);

        document.getElementById('btn-next').onclick = () => tutorialManager.next();
        document.getElementById('btn-prev').onclick = () => tutorialManager.prev();
        document.getElementById('btn-skip').onclick = () => tutorialManager.skip();
        document.getElementById('tutorial-action-btn').onclick = () => tutorialManager.performAction();
        
        tutorialManager.render();
    },
    render: () => {
        const step = tutorialManager.steps[tutorialManager.currentStep];
        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-content').textContent = step.content;
        
        const actionBtn = document.getElementById('tutorial-action-btn');
        if (step.action) {
            actionBtn.textContent = "Abrir Configurações do Zoom";
            actionBtn.classList.remove('hidden');
        } else {
            actionBtn.classList.add('hidden');
        }
    },
    next: () => {
        if (tutorialManager.currentStep < tutorialManager.steps.length - 1) {
            tutorialManager.currentStep++;
            tutorialManager.render();
        } else {
            tutorialManager.finish();
        }
    },
    prev: () => {
        if (tutorialManager.currentStep > 0) {
            tutorialManager.currentStep--;
            tutorialManager.render();
        }
    },
    skip: () => tutorialManager.finish(),
    finish: () => {
        if (document.getElementById('check-no-show').checked) {
            tutorialManager.setSkipped(true);
        }
        tutorialManager.hide();
    },
    performAction: async () => {
        const step = tutorialManager.steps[tutorialManager.currentStep];
        if (step.action === 'open-zoom-settings') {
            await window.electronAPI.openZoomSettings();
        }
    },
    show: () => document.getElementById('tutorial-overlay').classList.remove('hidden'),
    hide: () => document.getElementById('tutorial-overlay').classList.add('hidden'),
    isSkipped: () => localStorage.getItem('tutorial-skipped') === 'true',
    setSkipped: (skipped) => localStorage.setItem('tutorial-skipped', skipped)
};

export default tutorialManager;
