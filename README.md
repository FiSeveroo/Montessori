# Enxoval Montessori

App web (PWA) para Filipe e Ana acompanharem o enxoval e a preparação da casa para a bebê, seguindo a abordagem Montessori. Requisitos e decisões em [docs/briefing.md](docs/briefing.md).

- **Front-end:** React + TypeScript + Vite + Tailwind, instalável na tela inicial (PWA).
- **Dados e login:** Firebase — Firestore (sincronização em tempo real, cache offline) e login com Google.
- **Hospedagem:** Firebase Hosting (plano Spark, gratuito).

## Segurança

- A configuração web do Firebase (`.env`) é pública por natureza; ela vai para o navegador de qualquer forma.
- Quem protege os dados são as regras em [firestore.rules](firestore.rules): só lê e escreve quem fez login com Google **e** tem um documento em `acesso/{email}`.
- Os e-mails liberados ficam só no Firestore, nunca no repositório.

## Configuração (uma vez)

1. **Firebase Console → Authentication → Sign-in method:** ative o provedor **Google**.
2. **Firestore → coleção `acesso`:** crie um documento para cada pessoa, com o **ID do documento = e-mail Google** (ex.: `fulano@gmail.com`). Pode deixar um campo qualquer, como `nome: "Filipe"`.
3. No terminal, dentro desta pasta:

   ```bash
   npx firebase login
   ```

4. Publicar regras e site:

   ```bash
   npm run deploy
   ```

5. Abrir `https://<projeto>.web.app`, entrar com Google e tocar em **Carregar itens iniciais** (só aparece com o banco vazio).

## Instalar no celular

- **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*.
- **Android (Chrome):** menu ⋮ → *Instalar app*.

## Desenvolvimento

```bash
npm install
npm run dev
```

Para logar em `localhost`, ele já é domínio autorizado por padrão no Firebase Auth.

## Estrutura

```
src/
  App.tsx              login com Google + verificação de acesso
  firebase.ts          inicialização (Auth + Firestore com cache offline)
  types.ts             modelo de dados e listas fixas (tipo, fase, prioridade…)
  lib.ts               preços, ordenação, utilidades
  data/store.ts        leitura em tempo real e todas as escritas
  data/seed.json       carga inicial (100 itens)
  components/          telas: Lista, ItemSheet, Progresso, NaoComprar, Categorias
firestore.rules        regras de acesso
firebase.json          hosting + regras
```

## Modelo de dados (Firestore)

- `itens/{id}` — campos do briefing, mais `preco_pago`, `links[]` ({url, loja, preco}), `feito_por`, `feito_em`, `atualizado_por`, `atualizado_em`, `categoria_anterior` (para devolver da lista "Não comprar").
- `categorias/{id}` — `{ nome, ordem }`; renomear atualiza os itens.
- `acesso/{email}` — lista de quem pode usar o app (editada só pelo console).

Totais: **estimado** = soma do preço estimado (ou do link mais barato, se não houver); **gasto** = soma do preço pago dos itens feitos. Itens "Não comprar" ficam fora de progresso e gastos.
