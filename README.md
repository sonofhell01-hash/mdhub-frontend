# MD HUB FINAL - Web

Versao web do cliente do MD HUB FINAL, derivada de `client/` (que e Vite + React + Tauri, para desktop).

Esta pasta contem apenas o frontend. O backend continua sendo o FastAPI que ja existe em `../server`
(nao foi duplicado aqui) - o app web conversa com ele via HTTP, exatamente como o cliente desktop ja fazia.

## O que mudou em relacao ao client/ (desktop)

- Removida a dependencia `@tauri-apps/api` e o script `tauri`.
- Removido o toggle "Iniciar com Windows" em Configuracoes (e um recurso de SO, nao existe em navegador).
- Removida a pasta `src-tauri` (nao se aplica a web).
- Tudo o mais (login, busca operacional, wizards de documentos, paineis de checkers/sync/WhatsApp,
  tema claro/escuro, copiar para area de transferencia) e o mesmo codigo React que ja rodava dentro do
  Tauri - ja usava `fetch` puro e `navigator.clipboard`, entao funciona igual em qualquer navegador moderno.

## Como rodar

```bash
cd HUBFINAL_WEB
npm install
cp .env.example .env
# edite .env se o backend nao estiver em http://10.136.59.60:8766
npm run dev
```

Abre em http://127.0.0.1:5173.

A URL do backend tambem pode ser trocada em tempo de uso (fica salva em localStorage do navegador,
sob a chave `mdhubfinal.apiBaseUrl.v1`), sem precisar rebuildar.

## Build de producao

```bash
npm run build
```

Gera a pasta `dist/` com HTML/JS/CSS estaticos, prontos para servir atras de qualquer servidor web
(nginx, Vercel, IIS, etc). Como o backend ja tem CORS/HTTP normal, basta apontar `VITE_API_BASE_URL`
para o endereco publico do backend antes do build (ou configurar depois pela UI).
