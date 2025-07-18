# FitFlow App - Estrutura e Instruções

Este projeto utiliza [Expo](https://expo.dev) e segue uma arquitetura modular baseada em pastas dentro de `src/`.

## Primeiros Passos

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o app:
   ```bash
   npx expo start
   ```

## Estrutura de Pastas

Todo o código-fonte está centralizado em `src/`:

```
src/
├── app/           # Rotas e telas principais (Expo Router)
├── assets/        # Imagens, fontes, ícones
├── components/    # Componentes reutilizáveis
│   ├── common/
│   ├── forms/
│   ├── screens/
│   └── ui/
├── constants/     # Constantes globais
├── hooks/         # Hooks customizados
├── screens/       # Telas organizadas por domínio
│   ├── auth/
│   ├── instructor/
│   └── student/
├── services/      # Serviços de API, Supabase, etc.
│   ├── api/
│   └── supabase/
├── types/         # Tipagens globais
├── utils/         # Funções utilitárias
├── scripts/       # Scripts auxiliares
```

## Observações

- Use sempre caminhos relativos a partir de `src/`.
- O arquivo `tsconfig.json` já está configurado para suportar imports com `@/`.
- Para adicionar novas telas, utilize as pastas em `src/screens/` ou `src/app/` conforme o fluxo.

## Mais informações

Consulte o PRD.md para detalhes de requisitos e arquitetura.
