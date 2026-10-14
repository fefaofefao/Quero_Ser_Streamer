# Quero ser Streamer — guia de publicação

Tudo que falta para ir à Play Store: conectar **AdMob**, **Firebase** e criar os **produtos** no Play Console. O código já está pronto para os três.

## Estrutura

| Pasta | O que é |
|---|---|
| `game/` | O jogo (JS + SVG/Canvas vetorial, sem imagens bitmap). `npm run build` gera os assets. |
| `android/` | Projeto Android Studio (Gradle). WebView + AdMob + UMP + Billing 8 + Firebase + notificações. |
| `tools/sim.mjs`, `tools/calibrate.mjs` | Simulador de 150 dias de jogo usado para balancear a economia. |
| `tools/build-apk-offline.sh` | Build de **teste** sem Gradle (anúncios/compras simulados). |
| `store/` | Ícone 512, feature graphic, 8 screenshots com legenda, textos da loja. |
| `privacy.html` | Política de privacidade (PT/EN/ES) — URL: `https://fefaofefao.github.io/quero-ser-streamer/privacy.html` |
| `web/` | Versão web jogável (demo, compras/anúncios simulados). |

Pacote: `com.fsamplabs.streameridle` · minSdk 24 · targetSdk 36 · versionCode 1.

## 1. Compilar

```bash
npm install
npm run build          # gera android/app/src/main/assets/www
```
Abra `android/` no Android Studio (ou `cd android && ./gradlew bundleRelease`). O AAB sai em `android/app/build/outputs/bundle/release/`.

### Assinatura
Coloque a chave de upload que te entreguei em `android/upload-keystore.jks` e o arquivo `android/keystore.properties`:
```
storeFile=upload-keystore.jks
storePassword=...
keyAlias=upload
keyPassword=...
```
Os dois estão no `.gitignore`. **Guarde a chave e a senha em local seguro** (sem ela não dá para atualizar o app; use o Play App Signing ao criar o app).

## 2. AdMob
1. Crie o app no AdMob (Android, "não está na loja ainda").
2. Crie 2 blocos: **Premiado** (rewarded) e **Intersticial**.
3. Troque os IDs de teste em `android/app/src/main/res/values/ads.xml` (`admob_app_id`, `admob_rewarded_id`, `admob_interstitial_id`).
4. Em *Privacidade e mensagens* crie a mensagem **GDPR** (e opcional US states). O app já chama o UMP no início e tem "Opções de privacidade" nos Ajustes.
5. `app-ads.txt` do site já tem sua linha de publisher.

Onde aparecem anúncios: dobrar ganho offline, passe extra de autógrafo, dobrar prêmio do evento, Gold x2 por 30 min (acumula até 4h), diamantes grátis (5/dia), trocar missão. Intersticial só depois de mudar de casa ou renascer, com intervalo mínimo de 4 min e nunca nos primeiros 15 min de jogo. Quem compra **VIP Sem Anúncios** recebe os prêmios sem ver anúncio.

## 3. Produtos no Play Console (Monetizar › Produtos)

| ID | Tipo | Sugestão de preço | Entrega |
|---|---|---|---|
| `starter_pack` | Produto no app (não consumível) | R$ 4,99 | Cadeira gamer + 300💎 + 2h de Gold x2 |
| `remove_ads` | não consumível | R$ 19,90 | Sem intersticiais e prêmios de anúncio na hora |
| `gold_boost` | não consumível | R$ 24,90 | Gold x2 permanente |
| `piggy_bank` | consumível | R$ 9,90 | Quebra o cofrinho (libera a partir de 300💎) |
| `gems_small` | consumível | R$ 4,99 | 120💎 |
| `gems_medium` | consumível | R$ 19,90 | 650💎 |
| `gems_large` | consumível | R$ 39,90 | 1.400💎 |
| `gems_huge` | consumível | R$ 79,90 | 3.000💎 |
| `gems_mega` | consumível | R$ 179,90 | 8.000💎 |
| `monthly_pass` | **Assinatura** (plano base mensal, renovação automática) | R$ 14,90/mês | +150💎 na hora, +40💎/dia, +1 passe de autógrafo, +2h offline |

Os preços mostrados no jogo vêm do Play (moeda local). Compras pendentes, reembolsos de consumíveis e "Restaurar compras" já são tratados. Os produtos só aparecem depois que um build assinado estiver em alguma trilha (teste interno serve).

## 4. Firebase
1. Crie o projeto, adicione app Android `com.fsamplabs.streameridle` com o **SHA-1** da chave de upload **e** o SHA-1 do *App Signing* (Play Console › Integridade do app).
2. Baixe `google-services.json` para `android/app/`. O Gradle ativa Firebase + Crashlytics sozinho quando o arquivo existe.
3. **Authentication** › ative o provedor **Google**.
4. **Firestore** › crie o banco e use estas regras:
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
5. **Remote Config** (opcional): parâmetro `game_config` (JSON), ex. `{"gold":1.2,"fame":1,"offline":1,"event":1}` — multiplicadores para balancear ao vivo sem atualizar o app.
6. Analytics registra: `tutorial_begin`, `market_unlock`, `house_buy`, `rebirth`, `equip_upgrade`, `autograph_done`, `ad_rewarded`, `purchase`, `iap_*`.

## 5. Ficha da loja
* Textos: `store/listing.md` (PT, EN, ES).
* Gráficos: `store/icon-512.png`, `store/feature-graphic-<idioma>.png`, `store/screenshots/<idioma>/*.png` (1080×1920; pt-BR, en-US e es-419).
* Política: `https://fefaofefao.github.io/quero-ser-streamer/privacy.html`
* **Público-alvo**: marque **13+** (13-15, 16-17, 18+). Marcar menores de 13 cai na política de Famílias e exige SDKs/anúncios certificados.
* **Classificação**: questionário IARC — sem violência real (os "jogos" no monitor são desenhos), compras no app, anúncios, sem interação entre usuários.
* **Segurança dos dados** (resumo): coleta *ID de publicidade/dispositivo* (AdMob, publicidade e análise), *interações no app* e *registros de falhas* (Firebase), *nome e e-mail* só se o usuário conectar com Google (funcionalidade, salvamento). Criptografado em trânsito: sim. Usuário pode pedir exclusão: sim (e-mail). Dados não vendidos.
* Declare **"Contém anúncios"** e **ID de publicidade** (finalidade: publicidade/análise).

## 6. Build de teste sem Gradle
`tools/build-apk-offline.sh` gera `build/offline/app-test.apk` com aapt2 + javac + dx (útil em máquinas sem Android Studio). Anúncios e compras aparecem como diálogos de teste. **Não publique este APK** — publique o AAB do Gradle.

## Atualizações
Suba `versionCode`/`versionName` em `android/app/build.gradle.kts`. O save tem campo de versão e migração automática (`game/src/state.js`).
