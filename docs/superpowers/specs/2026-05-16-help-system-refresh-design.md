# Spec: Sistema de Guia de Operação (Refresh do HELP.md)

**Data:** 2026-05-16
**Status:** Aprovado para Implementação

## 1. Objetivo
Tornar a operação do JW Meeting Player intuitiva para novos operadores (especialmente no Brasil), minimizando a necessidade de manuais externos e garantindo que o processo de automação do Zoom seja compreendido.

## 2. Conceito de Design
- **Localização:** O guia será exibido na **Área de Preview** (centro da tela principal).
- **Gatilho:** Exibido automaticamente quando **nenhum item** da playlist estiver selecionado.
- **Visual:** Layout vertical, ícones claros, texto grande e cores que combinam com o fundo branco do aplicativo.

## 3. Conteúdo do Guia (Português)

### Título: Guia de Operação
**Modo: Zoom Automático**

1. **Preparar Playlist**
   - Descrição: Crie e/ou escolha uma playlist na barra lateral.
   - Ícone: 📋

2. **Selecionar Mídia (Standby)**
   - Descrição: Clique no item. Ele ficará pronto, mas não aparecerá na TV ainda.
   - Ícone: 🖱️

3. **Iniciar Reprodução**
   - Descrição: Clique no Play. O vídeo aparecerá na 2ª tela e o Zoom será acionado.
   - Ícone: Botão Play azul (estilo UI real).

4. **Na janela do Zoom (Apenas na 1ª vez): Marcar "Otimizar"**
   - Descrição: Marque "Otimizar para clipe de vídeo" no Zoom.
   - Ícone: Mockup do checkbox do Zoom.

5. **Na janela do Zoom (Apenas na 1ª vez): Clique Duplo na Tela 2**
   - Descrição: Dê um clique duplo no quadro da "Tela 2" para iniciar.
   - Ícone: Mockup da janela de compartilhamento com indicação de clique duplo.

### Banner de Atenção (Destaque em Vermelho)
> **⚠️ ATENÇÃO:** Após a primeira configuração, o sistema fará os passos 4 e 5 **automaticamente**. Não mexa no mouse enquanto o Zoom estiver processando!

## 4. Requisitos Técnicos
- **Renderer:** O guia deve ser um componente HTML/CSS dentro da `div#preview-container`.
- **Lógica de Visibilidade:**
  ```javascript
  if (playlistSelected && itemSelected) {
      showMediaPreview();
  } else {
      showOperationGuide();
  }
  ```
- **Internacionalização:** Suporte para Português (padrão) e Japonês (conforme configuração do sistema).
- **Responsividade:** O guia deve se ajustar ao tamanho da área de preview sem quebrar o layout.

## 5. Próximos Passos
1. Criar branch `feature/operation-guide-ui`.
2. Implementar o template HTML/CSS do guia no `uiManager.js` ou `app.js`.
3. Ajustar a lógica de exibição para alternar entre o guia e o vídeo/imagem real.
