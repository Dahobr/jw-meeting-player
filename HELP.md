# Guia de Ajuda: JW Meeting Player

Bem-vindo ao JW Meeting Player. Este guia completo foi desenvolvido para auxiliar na configuração, operação e solução de problemas do aplicativo durante as reuniões.

---

## Sumário
* [Introdução](#introdução)
* [1. Modos de Integração com Zoom](#modos-de-integração-com-zoom)
* [2. Configuração Inicial](#configuração-inicial)
* [3. Criação de Playlist](#criação-de-playlist)
* [4. Guia de Operação](#guia-de-operação)
* [5. Solução de Problemas](#solução-de-problemas)
* [6. Perguntas Frequentes (FAQ)](#faq)
* [7. Dicas Extras](#dicas-extras)

---

<a name="introdução"></a>
## Introdução
O JW Meeting Player é uma ferramenta desenvolvida para organizar e reproduzir mídias de reuniões de forma eficiente, permitindo o controle de apresentações (vídeos e imagens) com suporte a uma segunda tela e integração com o Zoom.

---

<a name="modos-de-integração-com-zoom"></a>
## 1. Modos de Integração com Zoom
O JW Meeting Player oferece três modos para a automação do compartilhamento de tela com o Zoom. **Para utilizar estes modos, é fundamental realizar a configuração inicial descrita no item 2 deste guia.**

- **Zoom Automático (Auto):** O player assume o controle total do compartilhamento de tela do Zoom, acionando-o automaticamente ao iniciar a reprodução. Ideal para uma operação mais ágil.
- **Zoom Semiautomático (Semi):** O player abre automaticamente a janela de compartilhamento do Zoom. Caso seja um vídeo, ele pausará a reprodução automaticamente enquanto a janela do Zoom é aberta, aguardando que o usuário selecione a "Tela 2" no Zoom para confirmar o compartilhamento. Assim que o compartilhamento for detectado, o player retomará o vídeo automaticamente.
- **Zoom Manual (Off):** O player funciona como um reprodutor de mídia convencional na segunda tela. O compartilhamento de tela no Zoom deve ser feito manualmente pelo usuário.

---

<a name="configuração-inicial"></a>
## 2. Configuração Inicial

### Configurando o Zoom
Para que o compartilhamento de tela funcione automaticamente:
1. Abra o Zoom > **Configurações** (engrenagem).
2. Vá em **Atalhos do teclado**.
3. Procure por **"Iniciar/interromper compartilhamento de tela"**.
4. Ative a opção **Atalho global** e defina como **Alt+S**.

### Automação (Configuração Inicial)
Na primeira vez que você utilizar a automação, o Zoom solicitará a confirmação da janela de compartilhamento para garantir a segurança da sessão.

1. **Ativação automática:** Ao iniciar a reprodução de um item, o player abrirá automaticamente a janela de compartilhamento do Zoom.
2. **Otimização:** Na janela de compartilhamento do Zoom, marque a opção "Otimizar para clipe de vídeo".
3. **Seleção de Tela:** Dê um clique duplo na "Tela 2" (ou no quadro correspondente) para confirmar e iniciar o compartilhamento.
4. **Importante:** Após esta configuração inicial, o player passará a realizar o compartilhamento da "Tela 2" automaticamente nas próximas vezes, sem novas intervenções. **Não mova o mouse durante o processamento automático.**

---

<a name="criação-de-playlist"></a>
## 3. Criação de Playlist
- Crie playlists por reunião (ex: "Reunião de Meio de Semana") no menu lateral.
- Digite o nome da playlist na caixa de texto e clique no **"+"** ou tecle **Enter** para salvar.

### Importação e Adição de Mídias
- **Vídeos:** Faça o download no site [jw.org](https://www.jw.org) através do navegador integrado. O player detecta o arquivo automaticamente (.mp4).
- **Imagens:** Ao visualizar a imagem no navegador integrado, clique com o **botão direito do mouse** e selecione "Adicionar à playlist".
- **Formatos suportados:** O player suporta arquivos de vídeo (.mp4) e imagem (.jpg, .jpeg, .png, .gif, .bmp, .webp, .svg).
- **Arquivos .jwlplaylist:** Ao importar arquivos neste formato, o player suporta apenas imagens contidas nele. Note que a ordem dos itens deve ser ajustada manualmente após a importação.

---

<a name="guia-de-operação"></a>
## 4. Guia de Operação

### Primeiros Passos
- Lembre-se: A automação do compartilhamento Zoom funciona automaticamente após a confirmação manual feita na primeira vez que você utilizar cada tipo de item.

### Modo de Standby (Preparação)
- Ao clicar em um item da playlist, ele entra em modo **Standby**.
- O item é carregado na tela de pré-visualização, mas **não é compartilhado** com a segunda tela ou Zoom neste momento. Isso garante segurança antes de exibir o conteúdo.

### Controles de Reprodução
- **Reproduzir:** Inicia a exibição na segunda tela e dispara o compartilhamento no Zoom.
- **Pausar:** Interrompe temporariamente a exibição do vídeo, mantendo o compartilhamento.
- **Parar:** Encerra a exibição e fecha o compartilhamento. Se você pressionar "Parar" enquanto um item estiver em Standby, o player avançará automaticamente para o próximo item da lista.

---

<a name="solução-de-problemas"></a>
## 5. Solução de Problemas

### Problemas comuns com o Zoom
- **Compartilhamento não inicia:** Verifique se o atalho global **Alt+S** está configurado corretamente no Zoom.

### Arquivos não carregando
- Verifique se o arquivo baixado não está corrompido.
- Tente remover e adicionar o arquivo novamente à playlist.

---

<a name="faq"></a>
## 6. Perguntas Frequentes (FAQ)

**Por que preciso baixar os arquivos manualmente no JW.org?**
Para seguir os termos de uso do site, o download deve ser realizado pelo usuário. O player apenas facilita a organização e reprodução desses arquivos.

**Posso mudar a ordem dos itens?**
Sim, você pode arrastar os itens na lista lateral para organizar a ordem de reprodução.

---

<a name="dicas-extras"></a>
## 7. Dicas Extras
- Mantenha o Zoom aberto antes de iniciar o JW Meeting Player para uma melhor integração.
- O navegador integrado pode ser usado como qualquer navegador comum para acessar outros recursos da reunião.
