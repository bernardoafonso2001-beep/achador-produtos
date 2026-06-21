# 🔍 Achador de Produtos

App mobile para identificar produtos por foto e encontrar onde comprar mais barato no Brasil.

## Como funciona
1. Você tira uma foto do produto
2. O Google Gemini identifica o que é
3. O app retorna descrição, características, faixa de preço e links diretos para compra

## Deploy no Vercel (passo a passo)

### 1. Subir o código no GitHub
- Crie uma conta em github.com
- Clique em "New repository" → dê o nome `achador-produtos`
- Faça upload de todos os arquivos desta pasta

### 2. Deploy no Vercel
- Acesse vercel.com e faça login com GitHub
- Clique em "Add New Project"
- Selecione o repositório `achador-produtos`
- Clique em "Deploy" (sem alterar nada)
- Aguarde ~2 minutos

### 3. Usar o app
- Acesse a URL gerada pelo Vercel (ex: achador-produtos.vercel.app)
- Toque em ⚙️ e insira sua API Key do Google AI Studio
- Tire uma foto e busque!

### Salvar na tela inicial do celular (como app)
- **iPhone:** Safari → compartilhar → "Adicionar à Tela de Início"
- **Android:** Chrome → menu (⋮) → "Adicionar à tela inicial"

## Trocar para a API da Anthropic (Claude)
Edite o arquivo `app/api/identify/route.js`:
- Troque a URL do fetch para `https://api.anthropic.com/v1/messages`
- Ajuste o formato do body conforme a documentação da Anthropic
- Altere o campo de API key no frontend para `anthropic_api_key`
