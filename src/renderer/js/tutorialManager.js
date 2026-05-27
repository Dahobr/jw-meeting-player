/**
 * tutorialManager.js
 * Manages the hierarchical interactive tutorial overlay workflow.
 */

const tutorialManager = {
    elements: {},

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
            description: "O aplicativo oferece três formas de interagir com o Zoom. Para que a automação funcione, precisamos também ajustar algumas configurações no próprio Zoom.",
            steps: [
                { 
                    title: "Escolha o Melhor Modo", 
                    content: `O aplicativo oferece três formas para iniciar o compartilhamento de mídia no Zoom, que podem ser selecionadas no <b>canto superior direito</b> da tela:
                    <ol style="text-align: left; padding-left: 20px; margin-top: 10px;">
                        <li style="margin-bottom: 10px;"><b>Automático:</b> (Recomendado) Após o início da reprodução, o app realiza todo o processo de compartilhamento no Zoom de forma automática.</li>
                        <li style="margin-bottom: 10px;"><b>Semiautomático:</b> Ao reproduzir uma mídia, o app abre automaticamente a janela de compartilhamento do Zoom; você então seleciona a tela desejada e inicia o compartilhamento.</li>
                        <li style="margin-bottom: 10px;"><b>Manual:</b> Você controla tudo manualmente no Zoom, abrindo a janela e iniciando o compartilhamento por conta própria.</li>
                    </ol>`, 
                    action: null 
                },
                { 
                    title: "Configuração do Zoom", 
                    content: `<p>Para que a automação funcione, precisamos ajustar as configurações de atalhos dentro do próprio Zoom.</p>
                              <p>Se o Zoom ainda não estiver aberto, abra-o primeiro. Depois, clique no botão abaixo para abrir a tela de <b>configurações</b> do seu aplicativo Zoom:</p>
                              <button id="btn-zoom-settings" class="tutorial-btn">Abrir Configurações do Zoom</button>
                              <p style="margin-top: 15px;">Nas configurações de 'Atalhos de Teclado' do Zoom, marque o <b>Alt+S</b> como <b>'Atalho Global'</b>.</p>
                              <p>Lembre-se de que, ao utilizar o modo <b>Automático</b>, as configurações detalhadas na seção de <b>Reprodução</b> são fundamentais para o sucesso da automação.</p>`, 
                    action: null 
                }            
            ]
        },
        {
            id: 2,
            title: "Criação de Playlists",
            description: "Aprenda a organizar suas reuniões criando listas personalizadas e importando os arquivos necessários para a exibição.",
            steps: [
                { 
                    title: "Criar Playlists", 
                    content: `<p>Para criar uma playlist, digite um nome fácil de identificar na caixa de texto localizada no painel esquerdo e, em seguida, clique no botão <b>'+'</b> ou pressione a tecla <b>Enter</b>.</p>
                              <p>Após a criação, basta clicar sobre o nome da lista para começar a adicionar conteúdos a ela.</p>`, 
                    action: null 
                },
                { 
                    title: "Adicionar mídia", 
                    content: `<p>Clique no botão <b>Reuniões</b> no topo da página e selecione <b>Apostila</b> ou <b>Estudo de A Sentinela</b>.</p>
                              <p>Ao encontrar um link de vídeo ou cântico, basta clicar nele para fazer o download, e o item será automaticamente adicionado à sua playlist.</p>
                              <p>Para adicionar imagens, clique com o botão direito sobre ela e selecione <b>Adicionar a imagem à playlist</b>.</p>
                              <p>Você também pode utilizar botões específicos nas páginas do JW.ORG para encontrar outros itens de mídia.</p>
                              <p>Para navegar pelas páginas, utilize o botão direito do mouse para acessar as opções de <b>Voltar</b> ou <b>Avançar</b>.</p>`, 
                    action: null 
                },
                { 
                    title: "Importar outros itens", 
                    content: `<p>Você pode importar seus próprios arquivos de imagem ou vídeo clicando no botão <b>Importar Arquivos</b>, localizado no canto inferior esquerdo.</p>
                              <p>Também é possível importar playlists do <b>JW Library</b>. Note que, no momento, o processo de importação permite apenas imagens e pode não manter a ordem original, sendo necessário reordená-las manualmente na lista.</p>`, 
                    action: null 
                }
            ]
        },
        {
            id: 3,
            title: "Reprodução",
            description: "Aprenda como controlar a exibição dos conteúdos durante a sua reunião.",
            steps: [
                { 
                    title: "Modo de Espera (Standby)", 
                    content: `<p>Ao clicar em um item da playlist, ele entra no modo de espera (standby). Nesse estado, o item é exibido apenas na visualização prévia, sem causar qualquer alteração no segundo monitor ou no Zoom.</p>`, 
                    action: null 
                },
                { 
                    title: "Reproduzir", 
                    content: `<p>Clique no botão de reprodução no <b>rodapé</b> para iniciar a exibição.</p>
                              <p>Se o modo do Zoom estiver definido como <b>Automático</b> ou <b>Semiautomático</b>, a janela de compartilhamento será aberta automaticamente.</p>
                              <p>Ao realizar o primeiro compartilhamento, siga estes passos:</p>
                              <ol style="text-align: left; padding-left: 20px; margin-top: 5px;">
                                <li style="margin-bottom: 5px;">Marque a opção <b>Otimizar para vídeo</b>.</li>
                                <li style="margin-bottom: 5px;">Dê um <b>clique duplo</b> na tela que deseja compartilhar (geralmente <b>Tela 2</b>).</li>
                              </ol>
                              <p>Por seguir estes passos:</p>
                              <ul style="text-align: left; padding-left: 20px; margin-top: 5px;">
                                <li style="margin-bottom: 5px;">No modo <b>Automático</b>, o aplicativo memorizará a posição da tela para agilizar os próximos compartilhamentos.</li>
                                <li style="margin-bottom: 5px;">Nos modos <b>Automático</b> e <b>Semiautomático</b>, a reprodução do vídeo iniciará automaticamente assim que o compartilhamento for estabelecido.</li>
                              </ul>`, 
                    action: null 
                }
            ]
        }
    ],

    currentSectionIdx: 0,
    currentStepIdx: -1,

    init: async () => {
        tutorialManager.elements = {
            overlay: document.getElementById('tutorial-overlay'),
            title: document.getElementById('tutorial-title'),
            content: document.getElementById('tutorial-content'),
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            btnSkip: document.getElementById('btn-skip'),
            checkNoShow: document.getElementById('check-no-show'),
            noShowLabel: document.querySelector('label[for="check-no-show"]') || document.querySelector('label')
        };

        tutorialManager.elements.btnNext.onclick = () => tutorialManager.next();
        tutorialManager.elements.btnPrev.onclick = () => tutorialManager.prev();
        tutorialManager.elements.btnSkip.onclick = () => tutorialManager.skipSection();
        
        tutorialManager.elements.content.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'btn-zoom-settings') {
                window.electronAPI.openZoomSettings();
            }
        });
        
        tutorialManager.render();
    },

    render: () => {
        const section = tutorialManager.sections[tutorialManager.currentSectionIdx];
        const el = tutorialManager.elements;
        const isIntro = (tutorialManager.currentStepIdx === -1);
        const isFirstScreen = (tutorialManager.currentSectionIdx === 0 && tutorialManager.currentStepIdx === -1);

        if (isIntro) {
            const titlePrefix = section.id > 0 ? `${section.id}. ` : "";
            el.title.innerHTML = titlePrefix + section.title;
            el.content.innerHTML = section.description;
        } else {
            const step = section.steps[tutorialManager.currentStepIdx];
            el.title.innerHTML = `${section.id}.${tutorialManager.currentStepIdx + 1} ${step.title}`;
            el.content.innerHTML = step.content;
        }

        el.btnPrev.classList.toggle('hidden', isFirstScreen);
        el.btnPrev.disabled = isFirstScreen;
        
        const isLastSection = (tutorialManager.currentSectionIdx === tutorialManager.sections.length - 1);
        const isLastStep = (section.steps.length > 0 && tutorialManager.currentStepIdx === section.steps.length - 1);
        el.btnNext.textContent = (isLastSection && (isLastStep || section.steps.length === 0)) ? "Finalizar" : "Próximo";
        
        // Skip button logic: Show only for section intro, excluding the very first welcome screen
        const isSkipVisible = (isIntro && !isFirstScreen);
        el.btnSkip.classList.toggle('hidden', !isSkipVisible);
        
        const controls = document.querySelector('.controls');
        if (isFirstScreen) {
            if (el.noShowLabel && !controls.contains(el.noShowLabel)) {
                controls.insertBefore(el.noShowLabel, controls.firstChild);
            }
            el.noShowLabel.classList.remove('hidden');
        } else {
            el.noShowLabel.classList.add('hidden');
        }
    },

    next: () => {
        const section = tutorialManager.sections[tutorialManager.currentSectionIdx];
        if (tutorialManager.currentStepIdx < section.steps.length - 1) {
            tutorialManager.currentStepIdx++;
        } else {
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

    prev: () => {
        if (tutorialManager.currentStepIdx > -1) {
            tutorialManager.currentStepIdx--;
        } else {
            if (tutorialManager.currentSectionIdx > 0) {
                tutorialManager.currentSectionIdx--;
                const prevSection = tutorialManager.sections[tutorialManager.currentSectionIdx];
                tutorialManager.currentStepIdx = prevSection.steps.length - 1;
            }
        }
        tutorialManager.render();
    },

    skipSection: () => {
        if (tutorialManager.currentSectionIdx < tutorialManager.sections.length - 1) {
            tutorialManager.currentSectionIdx++;
            tutorialManager.currentStepIdx = -1;
            tutorialManager.render();
        } else {
            tutorialManager.finish();
        }
    },

    finish: () => {
        if (tutorialManager.elements.checkNoShow && tutorialManager.elements.checkNoShow.checked) {
            tutorialManager.setSkipped(true);
        }
        window.close();
    },

    isSkipped: () => localStorage.getItem('tutorial-skipped') === 'true',
    setSkipped: (skipped) => localStorage.setItem('tutorial-skipped', skipped)
};

tutorialManager.init();

export default tutorialManager;
