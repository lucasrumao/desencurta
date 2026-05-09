# 🔗 Unravel — URL Expander

> Sistema completo de expansão de URLs encurtadas. Moderno, rápido, sem anúncios.

---

## 🗂️ Estrutura do Projeto

```
urlexpander/
├── frontend/               # PWA Web App (HTML/CSS/JS puro)
│   ├── index.html          # App completo (single-file)
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service Worker
│
└── backend/                # API REST Java (Spring Boot)
    ├── pom.xml
    └── src/main/java/com/urlexpander/
        ├── UrlExpanderApplication.java
        ├── controller/
        │   └── UrlExpanderController.java
        ├── service/
        │   └── UrlExpanderService.java
        ├── model/
        │   ├── ExpandResponse.java
        │   ├── RedirectHop.java
        │   └── ErrorResponse.java
        ├── config/
        │   ├── CorsConfig.java
        │   ├── CacheConfig.java
        │   └── RateLimitFilter.java
        └── exception/
            ├── GlobalExceptionHandler.java
            ├── InvalidUrlException.java
            ├── MaxRedirectsException.java
            └── RateLimitException.java
```

---

## 🚀 Como executar

### Pré-requisitos
- Java 21+
- Maven 3.9+
- Qualquer servidor HTTP estático (ex: `npx serve`, Python, Nginx)

---

### Backend (Spring Boot)

```bash
cd backend

# Build
mvn clean package -DskipTests

# Executar
java -jar target/url-expander-1.0.0.jar

# OU com Maven diretamente
mvn spring-boot:run
```

A API estará disponível em: **http://localhost:8080**

**Endpoints:**
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/expand?url=<URL>` | Expande uma URL encurtada |
| `GET` | `/health` | Health check simples |
| `GET` | `/actuator/health` | Health check detalhado |

**Exemplo de request:**
```bash
curl "http://localhost:8080/expand?url=https://bit.ly/3OIaVsE"
```

**Exemplo de response:**
```json
{
  "originalUrl": "https://bit.ly/3OIaVsE",
  "finalUrl": "https://www.exemplo.com/pagina-destino",
  "statusCode": 200,
  "redirects": [
    { "url": "https://bit.ly/3OIaVsE", "statusCode": 301 },
    { "url": "https://redirect.exemplo.com/track?...", "statusCode": 302 }
  ],
  "domain": "www.exemplo.com",
  "durationMs": 342
}
```

---

### Frontend (PWA)

```bash
cd frontend

# Opção 1: Python (mais simples)
python3 -m http.server 3000

# Opção 2: Node.js
npx serve . -p 3000

# Opção 3: Node.js (com live reload)
npx live-server --port=3000
```

Acesse: **http://localhost:3000**

---

## ⚙️ Configuração

### Apontar frontend para o backend

No `frontend/index.html`, ajuste a variável:
```js
const API_BASE = 'http://localhost:8080'; // Dev
// const API_BASE = 'https://api.suaapp.com'; // Produção
```

### Rate Limiting
Padrão: **30 requisições/minuto por IP**.
Ajuste em `RateLimitFilter.java`:
```java
private static final int MAX_REQUESTS_PER_MINUTE = 30;
```

### Cache
Padrão: **1.000 URLs em cache por 10 minutos**.
Ajuste em `CacheConfig.java`:
```java
.maximumSize(1000)
.expireAfterWrite(10, TimeUnit.MINUTES)
```

---

## 🌐 Deploy em Produção

### Backend — Opção A: JAR em VPS

```bash
# Build
mvn clean package

# Copiar para servidor
scp target/url-expander-1.0.0.jar usuario@servidor:/app/

# Executar como serviço (systemd)
# /etc/systemd/system/unravel.service
[Unit]
Description=Unravel URL Expander
After=network.target

[Service]
User=www-data
WorkingDirectory=/app
ExecStart=/usr/bin/java -jar /app/url-expander-1.0.0.jar
Restart=always

[Install]
WantedBy=multi-user.target
```

### Backend — Opção B: Docker

```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/url-expander-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```bash
docker build -t unravel-backend .
docker run -p 8080:8080 unravel-backend
```

### Backend — Opção C: Railway / Render / Fly.io

Faça push para GitHub e conecte o repositório diretamente.

### Frontend — Vercel / Netlify / GitHub Pages

O frontend é um arquivo HTML estático. Faça deploy direto da pasta `frontend/`:
```bash
# Vercel
npx vercel deploy frontend/

# Netlify
netlify deploy --dir frontend/
```

---

## 📱 PWA — Instalação no celular

1. Acesse o frontend pelo celular
2. Chrome: menu "Adicionar à tela inicial"
3. Safari (iOS): Compartilhar → "Adicionar à Tela de Início"

Para funcionar como PWA completo, sirva o frontend via **HTTPS**.

> **Dica:** Use o [Cloudflare Pages](https://pages.cloudflare.com) para HTTPS gratuito e CDN global.

---

## 🔐 Segurança

- **Hosts bloqueados:** localhost, IPs privados (SSRF prevention)
- **Redirecionamentos:** Limite de 15 saltos por requisição
- **Rate Limit:** 30 req/min por IP (janela deslizante)
- **CORS:** Configurável por ambiente
- **User-Agent:** Custom para identificar o bot

---

## 🛣️ Roadmap / Próximas funcionalidades

- [ ] Integração com Google Safe Browsing API
- [ ] Extração de Open Graph (título, imagem, descrição)
- [ ] Banco de dados PostgreSQL para histórico
- [ ] Dashboard de analytics
- [ ] Suporte a URLs com autenticação (Twitter, etc.)
- [ ] API key pública para desenvolvedores
- [ ] Browser extension (Chrome/Firefox)

---

## 📄 Licença

MIT — Livre para usar, modificar e distribuir.
