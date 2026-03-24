# Sistema Integrado de Análise do Censo Escolar — PI 2 / PI 3

## Como executar com Docker Compose
```bash
docker compose up -d --build
```

- Backend: http://localhost:3001 (docs em /docs, health em /health)
- Frontend: http://localhost:5173 (ou porta 80 se usar Nginx build)
- Banco MySQL: localhost:3306 (db=censo, user=app, pass=app)

## Variáveis de ambiente (backend/.env)
Veja `backend/.env.example`.

## Testes & CI
- Testes: `cd backend && npm test`
- CI: GitHub Actions em `.github/workflows/ci.yml`

## Deploy em Nuvem
- **Backend**: use Dockerfile (Render, Railway, AWS ECS).
- **Frontend**: Vercel/Netlify (build `npm run build`, output `dist/`), ou imagem Nginx.