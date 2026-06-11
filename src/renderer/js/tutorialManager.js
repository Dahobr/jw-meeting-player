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
                    content: `<p>Para que a automação funcione, siga as instruções abaixo:</p>
                              <p>1. Clique no botão abaixo para abrir as configurações do Zoom:</p>
                              <button id="btn-zoom-settings" class="tutorial-btn">Abrir Configurações do Zoom</button>
                              <p style="margin-top: 15px;">2. No menu lateral esquerdo, entre em <b>Atalhos do Teclado</b>. Em seguida, localize <b>'Iniciar/interromper compartilhamento de tela'</b> e marque o <b>Alt+S</b> como <b>'Atalho Global'</b>.</p>
                              <p class="tutorial-note">Lembre-se: esta configuração é necessária apenas uma vez. O primeiro compartilhamento deve ser feito manualmente, mas a partir da segunda vez, será automático. Consulte a seção <a href="#" class="toc-link" data-section="3">Controle de Apresentação</a> para mais detalhes.</p>`, 
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
                },
                { 
                    title: "Exportar Playlists", 
                    content: `<p>Você pode preparar suas listas com antecedência para evitar correria antes da reunião. Para isso, clique no botão de <b>três pontos (⋮)</b> ao lado do nome da lista e selecione <b>Exportar</b>.</p>
                              <p>O arquivo será salvo na sua pasta de Downloads. Você pode enviá-lo para outro computador ou para um colega através do <b>WhatsApp</b>.</p>
                              <p>Ao baixar um desses arquivos pelo WhatsApp, o aplicativo o reconhecerá e carregará tudo automaticamente. Ele também cuidará do download dos vídeos para você, deixando tudo pronto para o uso.</p>`, 
                    action: null 
                }
                ]
                },
        {
            id: 3,
            title: "Controle de Apresentação",
            description: "Aprenda como controlar a exibição dos conteúdos durante a sua reunião.",
            steps: [
                { 
                    title: "Modo de Espera (Standby)", 
                    content: `<p>Ao clicar em um item da playlist, ele entra no modo de espera (standby). Nesse estado, o item é exibido apenas na visualização prévia, sem causar qualquer alteração no segundo monitor ou no Zoom.</p>`, 
                    action: null 
                },
                { 
                    title: "Colocar no Ar", 
                    content: `<p>Clique no botão de reprodução no <b>rodapé</b> para iniciar a exibição.</p>
                              <p>Se o modo do Zoom estiver definido como <b>Automático</b> ou <b>Semiautomático</b>, a janela de compartilhamento será aberta automaticamente.</p>
                              <p>Ao realizar o primeiro compartilhamento, siga estes passos:</p>
                              <ol style="text-align: left; padding-left: 20px; margin-top: 5px;">
                                <li style="margin-bottom: 5px;">Marque a opção <b>Otimizar para clipe de vídeo</b>.</li>
                                <li style="margin-bottom: 5px;">Dê um <b>clique duplo</b> na tela que deseja compartilhar (geralmente <b>Tela 2</b>).</li>
                              </ol>
                              <p>Por seguir estes passos:</p>
                              <ul style="text-align: left; padding-left: 20px; margin-top: 5px;">
                                <li style="margin-bottom: 5px;">No modo <b>Automático</b>, o aplicativo memorizará a posição da tela para realizar os próximos compartilhamentos.</li>
                                <li style="margin-bottom: 5px;">Nos modos <b>Automático</b> e <b>Semiautomático</b>, a reprodução do vídeo iniciará automaticamente assim que o compartilhamento for estabelecido.</li>
                              </ul>`, 
                    action: null 
                },
                {
                    title: "Navegação entre Itens",
                    content: `<p>Utilize os botões de <b>Anterior</b> e <b>Próximo</b> no rodapé para alternar entre os itens da playlist.</p>
                              <p><b>Modo de Espera (Standby):</b> Esses botões permitem alternar entre os itens na fila de espera sem afetar o que está sendo exibido na tela secundária.</p>
                              <p><b>Modo Em Exibição (No Ar):</b> Os botões permitem pular para o próximo ou anterior item sem precisar interromper o compartilhamento de tela no Zoom.</p>`,
                    action: null
                }
            ]
        },
        {
            id: 4,
            title: "Dicas e Soluções",
            description: "Solucione problemas comuns e otimize o uso do player com estas dicas práticas.",
            steps: [
                { 
                    title: "Atalhos", 
                    content: `<p>Utilize os seguintes atalhos para agilizar sua operação:</p>
                              <table style="width: 100%; text-align: left; border-collapse: collapse; margin-top: 10px;">
                                <tr><th>Atalho</th><th>Função</th></tr>
                                <tr><td><b>Ctrl+ +</b></td><td>Ampliar página</td></tr>
                                <tr><td><b>Ctrl+ -</b></td><td>Reduzir página</td></tr>
                                <tr><td><b>Ctrl+ 0</b></td><td>Zoom original</td></tr>
                                <tr><td><b>Espaço</b></td><td>Play/Pause</td></tr>
                                <tr><td><b>Delete</b></td><td>Excluir item/playlist</td></tr>
                              </table>`,
                    action: null 
                },
                { 
                    title: "Dicas de Uso", 
                    content: `<p><b>Navegação:</b> O navegador integrado permite acesso a outros sites além do JW.ORG, funcionando como um navegador comum.</p>
                              <p><b>Atenção com áudio no navegador integrado:</b> Ao reproduzir áudios no navegador integrado, o som será transmitido. Certifique-se de parar o áudio antes de iniciar a playlist, para evitar a sobreposição de sons.</p>
                              <p><b>Reprodução direta:</b> Ao pressionar o botão de reprodução em um item, o vídeo ou imagem é exibido imediatamente, sem passar pelo modo de espera (standby).</p>
                              <p><b>Modo Manual:</b> O modo manual permite operar sem o Zoom, ou compartilhar apenas partes específicas conforme necessário.</p>
                              <p><b>Uso sem tela secundária:</b> É possível utilizar o player integrado ao Zoom sem a necessidade de conectar uma tela secundária.</p>`, 
                    action: null 
                },
                { 
                    title: "Solução de Problemas", 
                    content: `<p><b>Problemas com o Zoom?</b> Verifique se o Zoom está aberto e se o atalho Alt+S está configurado como Atalho Global.</p>
                              <p><b>O conteúdo não aparece na tela?</b> Se o <b>JW Library</b> estiver aberto com a função de <b>segunda tela</b> ativada, ele pode estar sobrepondo e escondendo o conteúdo deste aplicativo. Certifique-se de desativar a segunda tela no JW Library ou fechar o programa antes de exibir a mídia.</p>`, 
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
            btnSumario: document.getElementById('btn-sumario'),
            checkNoShow: document.getElementById('check-no-show'),
            noShowLabel: document.querySelector('label[for="check-no-show"]') || document.querySelector('label')
        };

        // Load initial state from config
        if (window.electronAPI && window.electronAPI.getConfig) {
            try {
                const config = await window.electronAPI.getConfig();
                if (tutorialManager.elements.checkNoShow) {
                    tutorialManager.elements.checkNoShow.checked = config.tutorialSkipped || false;
                }
            } catch (err) {
                console.error('[Tutorial] Failed to load config:', err);
            }
        }

        tutorialManager.elements.btnNext.onclick = () => tutorialManager.next();
        tutorialManager.elements.btnPrev.onclick = () => tutorialManager.prev();
        tutorialManager.elements.btnSumario.onclick = () => tutorialManager.jumpToSection(0);

        if (tutorialManager.elements.checkNoShow) {
            tutorialManager.elements.checkNoShow.onchange = (e) => {
                tutorialManager.setSkipped(e.target.checked);
            };
        }
        
        tutorialManager.elements.content.addEventListener('click', async (e) => {
            if (e.target && e.target.id === 'btn-zoom-settings') {
                const result = await window.electronAPI.openZoomSettings();
                const warning = document.getElementById('zoom-warning');
                
                if (result.success) {
                    if (warning) warning.style.display = 'none';
                } else {
                    let warnEl = warning;
                    if (!warnEl) {
                        warnEl = document.createElement('p');
                        warnEl.id = 'zoom-warning';
                        warnEl.style.color = '#e74c3c';
                        warnEl.style.marginTop = '10px';
                        warnEl.style.fontWeight = 'bold';
                        e.target.parentNode.insertBefore(warnEl, e.target.nextSibling);
                    }
                    warnEl.textContent = 'Zoom não detectado ou botão de configurações não encontrado. Por favor, abra o Zoom e tente novamente.';
                    warnEl.style.display = 'block';
                }
            } else if (e.target && e.target.classList.contains('toc-link')) {
                e.preventDefault();
                const sectionId = parseInt(e.target.dataset.section);
                tutorialManager.jumpToSection(sectionId);
            } else if (e.target && e.target.classList.contains('step-link')) {
                e.preventDefault();
                const stepIdx = parseInt(e.target.dataset.step);
                tutorialManager.jumpToStep(stepIdx);
            }
        });
        
        tutorialManager.render();
    },

    jumpToSection: (sectionId) => {
        const idx = tutorialManager.sections.findIndex(s => s.id === sectionId);
        if (idx !== -1) {
            tutorialManager.currentSectionIdx = idx;
            tutorialManager.currentStepIdx = -1;
            tutorialManager.render();
        }
    },

    jumpToStep: (stepIdx) => {
        tutorialManager.currentStepIdx = stepIdx;
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
            
            if (isFirstScreen) {
                let tocHtml = `<div class="tutorial-toc">
                    <h3>Sumário:</h3>
                    <ul>
                        ${tutorialManager.sections.slice(1).map(s => `
                            <li><a href="#" class="toc-link" data-section="${s.id}">${s.id}. ${s.title}</a></li>
                        `).join('')}
                    </ul>
                </div>`;
                el.content.innerHTML = section.description + tocHtml;
            } else {
                let stepsHtml = '';
                if (section.steps && section.steps.length > 0) {
                    stepsHtml = `<div class="tutorial-toc section-toc">
                        <h4>Nesta seção:</h4>
                        <ul>
                            ${section.steps.map((step, idx) => `
                                <li><a href="#" class="step-link" data-step="${idx}">${section.id}.${idx + 1} ${step.title}</a></li>
                            `).join('')}
                        </ul>
                    </div>`;
                }
                el.content.innerHTML = section.description + stepsHtml;
            }
        } else {
            const step = section.steps[tutorialManager.currentStepIdx];
            el.title.innerHTML = `${section.id}.${tutorialManager.currentStepIdx + 1} ${step.title}`;
            el.content.innerHTML = step.content;
        }

        el.btnPrev.classList.toggle('hidden', isFirstScreen);
        el.btnPrev.disabled = isFirstScreen;
        
        // Show Sumário button only if not on the first screen (Bem-vindo)
        el.btnSumario.classList.toggle('hidden', isFirstScreen);
        el.btnSumario.disabled = isFirstScreen;
        
        const isLastSection = (tutorialManager.currentSectionIdx === tutorialManager.sections.length - 1);
        const isLastStep = (section.steps.length > 0 && tutorialManager.currentStepIdx === section.steps.length - 1);
        el.btnNext.textContent = (isLastSection && (isLastStep || section.steps.length === 0)) ? "Finalizar" : "Próximo";
        
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

    finish: () => {
        window.close();
    },

    setSkipped: (skipped) => {
        if (window.electronAPI && window.electronAPI.updateConfig) {
            window.electronAPI.updateConfig({ tutorialSkipped: skipped });
        }
    }
};

tutorialManager.init();

export default tutorialManager;
