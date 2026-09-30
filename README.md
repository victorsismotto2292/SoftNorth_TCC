# SoftNorth

Demonstração web em português do SoftNorth, proposta SaaS da TechRiar para organizar pedidos e apoiar a precificação de brindes personalizados. O front-end usa React, TypeScript, Vite e componentes Ionic.

## Executar localmente

```bash
npm install
npm run dev
```

Sem as variáveis Firebase, o painel abre em modo de demonstração. Os pedidos de exemplo e alterações são armazenados apenas no `localStorage` deste navegador; não são dados reais da North Bag.

## Ativar Firebase

1. Copie `.env.example` para `.env.local` e preencha as chaves da configuração **Web** do projeto Firebase.
2. No Firebase Console, habilite Authentication com E-mail/Senha e crie o banco Firestore.
3. Publique as regras de `firestore.rules` (por exemplo, com Firebase CLI conectado ao projeto correto: `firebase deploy --only firestore:rules`).
4. Reinicie o servidor Vite para carregar as variáveis.

A aplicação grava pedidos em `users/{uid}/demands/{id}`; cada conta só pode ler e modificar o próprio caminho segundo as regras do repositório. A configuração Web do Firebase no navegador é pública por natureza. **Não** coloque chaves de service account, tokens administrativos ou outros segredos em variáveis `VITE_*` nem no repositório.

O arquivo `.env.local` é ignorado pelo Git. As regras e o exemplo de ambiente precisam ser aplicados/verificados no projeto Firebase antes de usar dados pessoais reais. A interface não é um orçamento industrial oficial: custo unitário e margem são premissas editáveis da demonstração.

## Build

```bash
npm run typecheck
npm run build
```

O resultado estático é gerado em `dist/`.
