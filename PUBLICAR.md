# Publicar hoje — passo a passo

## 0. Secrets no GitHub
Repositório › Settings › Secrets and variables › Actions › **New repository secret**

| Nome do secret | O que colar |
|---|---|
| `GOOGLE_SERVICES_JSON` | O conteúdo inteiro do `google-services.json` baixado do Firebase |
| `ANDROID_KEYSTORE_BASE64` | Conteúdo do arquivo `ANDROID_KEYSTORE_BASE64.txt` (chave de upload) |
| `ANDROID_KEYSTORE_PASSWORD` | Conteúdo de `ANDROID_KEYSTORE_PASSWORD.txt` |
| `ADMOB_APP_ID` | ID do app no AdMob (`ca-app-pub-XXXX~YYYY`) |
| `ADMOB_REWARDED_ID` | ID do bloco Premiado (`ca-app-pub-XXXX/ZZZZ`) |
| `ADMOB_INTERSTITIAL_ID` | ID do bloco Intersticial |

Depois: aba **Actions › Android › Run workflow**. Ao terminar, baixe o artefato `quero-ser-streamer-N`: contém `app-release.aab` (Play) e `app-release.apk`.
O versionCode é automático (nº do run + 10), sempre maior que o anterior.

## 1. Play Console — criar o app
* Nome: **Quero ser Streamer: Idle Tycoon** · Idioma padrão: Português (Brasil) · Jogo · Gratuito
* Pacote (vem do AAB): `com.fsamplabs.streameridle`
* Play App Signing: **usar chave gerada pelo Google** (padrão). O AAB vai assinado com a chave de upload.
* Upload key — SHA-1: `71:F7:B6:94:86:58:73:C8:5E:C0:96:C3:3E:93:91:BE:69:24:EB:35`
  SHA-256: `22:DB:62:D0:3F:A5:0F:C7:2B:C6:F2:E4:35:8A:AE:CA:A4:E8:B1:69:74:50:00:3C:C4:62:AF:39:1B:DE:D0:5B`

### Configuração do app (Painel › "Configurar o app")
| Item | Resposta |
|---|---|
| Política de privacidade | `https://fefaofefao.github.io/quero-ser-streamer/privacy.html` |
| Acesso ao app | Todo o app disponível sem restrições |
| Anúncios | **Sim, contém anúncios** |
| Classificação (IARC) | Categoria Jogo; sem violência realista, sem sexo, sem drogas, sem apostas; **compras digitais: sim**; usuários não interagem; não compartilha localização → resultado esperado Livre/L |
| Público-alvo | **13-15, 16-17, 18+** (não marcar menores de 13) · "Pode atrair crianças sem querer?" → Não |
| App de notícias / governo / saúde / financeiro | Não |
| ID de publicidade | **Sim**, usa — finalidades: Publicidade e marketing, Análise |
| Segurança dos dados | ver abaixo |
| Categoria | Jogo › **Simulação** · Tags: Idle, Tycoon, Casual |
| E-mail de contato | fe.m.sampaio@hotmail.com · Site: https://fefaofefao.github.io |

### Segurança dos dados
* Coleta dados? **Sim**. Criptografados em trânsito? **Sim**. Usuário pode pedir exclusão? **Sim** (por e-mail).
* **Informações pessoais › Nome e Endereço de e-mail** — coletados, opcionais (só se conectar com Google), finalidade: Funcionalidade do app / Gerenciamento de conta. Não compartilhados.
* **Atividade no app › Interações no app** — coletado, Análise (Firebase).
* **Informações e desempenho do app › Registros de falhas, Diagnóstico** — coletado, Análise (Crashlytics).
* **IDs de dispositivo ou outros** — coletado **e compartilhado** (AdMob), Publicidade e Análise.
* **Histórico de compras** — coletado, Funcionalidade (Google Play Billing).

### Produtos (Monetizar › Produtos) — **só aparecem depois de subir o 1º AAB**
Produtos no app (todos ativos):
| ID | Nome | Preço |
|---|---|---|
| `starter_pack` | Pacote Iniciante | R$ 4,99 |
| `remove_ads` | VIP Sem Anúncios | R$ 19,90 |
| `gold_boost` | Patrocínio Dourado | R$ 24,90 |
| `piggy_bank` | Cofrinho de Diamantes | R$ 9,90 |
| `gems_small` | 120 Diamantes | R$ 4,99 |
| `gems_medium` | 650 Diamantes | R$ 19,90 |
| `gems_large` | 1.400 Diamantes | R$ 39,90 |
| `gems_huge` | 3.000 Diamantes | R$ 79,90 |
| `gems_mega` | 8.000 Diamantes | R$ 179,90 |

Assinatura: ID `monthly_pass` · nome "Passe Mensal" · plano base ID `mensal`, renovação automática **mensal**, R$ 14,90.

### Ficha da loja (textos em `store/listing.md`)
* Ícone: `store/icon-512.png` · Gráfico de recursos: `store/feature-graphic-1024x500.png`
* Capturas de tela do telefone: `store/screenshots/01..08` (mín. 2, recomendo as 8)

### Lançamento
Recomendado: **Teste interno** primeiro (sobe na hora, testa compras com conta de teste em Configuração › Teste de licença), depois **Produção**. Conta pessoal nova exige teste fechado com 12 testadores por 14 dias antes da produção — se for o seu caso, comece pelo **Teste fechado**.

## 2. AdMob
1. Apps › Adicionar app › Android › "O app está listado?" **Não** (vincule à loja depois que publicar).
2. Nome: Quero ser Streamer. Copie o **ID do app** → secret `ADMOB_APP_ID`.
3. Blocos de anúncios:
   * **Premiado** · nome `rewarded_main` · recompensa: 1 "Prêmio" → `ADMOB_REWARDED_ID`
   * **Intersticial** · nome `interstitial_main` → `ADMOB_INTERSTITIAL_ID`
4. Privacidade e mensagens › **GDPR** › criar mensagem para o app (idioma PT/EN/ES) e publicar. (Opcional: regulamentos estaduais dos EUA.)
5. `app-ads.txt` já está no site (`google.com, pub-7483085200976329, DIRECT, f08c47fec0942fa0`). Na ficha da Play, o "Site" precisa ser `https://fefaofefao.github.io`.
6. Após publicar: AdMob › App › Configurações › vincular à Google Play.

## 3. Firebase
1. console.firebase.google.com › Adicionar projeto "Quero ser Streamer" (Analytics: ativar, conta padrão).
2. Adicionar app **Android**: pacote `com.fsamplabs.streameridle`, apelido "Android".
   SHA-1: o da chave de upload acima. **Depois do 1º upload**, adicione também o SHA-1 da *chave de assinatura do app* (Play Console › Teste e lançamento › Integridade do app › Assinatura de apps) — sem ele o login Google não funciona para quem baixa da loja.
3. Baixe o `google-services.json` → cole tudo no secret **`GOOGLE_SERVICES_JSON`**. Sempre que adicionar um SHA-1 novo, baixe de novo e atualize o secret.
4. Authentication › Começar › **Google** › ativar (e-mail de suporte: o seu).
5. Firestore Database › Criar (modo produção, região `southamerica-east1`) › Regras:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /saves/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
6. Crashlytics: abrir a página uma vez (ativa sozinho no 1º crash/relato).
7. Remote Config (opcional): parâmetro `game_config` tipo JSON valor `{"gold":1,"fame":1,"offline":1,"event":1}`.
