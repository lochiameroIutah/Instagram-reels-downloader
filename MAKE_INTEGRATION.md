# Integrazione con Make (ex Integromat)

Questo documento descrive come configurare Make (ex Integromat) per salvare automaticamente i video di Instagram su Google Drive.

## Prerequisiti

1. Un account su [Make](https://www.make.com) (è disponibile un piano gratuito)
2. Un account Google con accesso a Google Drive

## Configurazione dello scenario in Make

### 1. Creare un nuovo scenario

1. Accedi al tuo account Make
2. Crea un nuovo scenario
3. Cerca e seleziona il modulo "Webhook" come trigger

### 2. Configurare il Webhook

1. Seleziona "Custom webhook" come tipo di webhook
2. Copia l'URL del webhook generato (lo userai come valore per la variabile d'ambiente `MAKE_WEBHOOK_URL`)
3. Configura il webhook per accettare richieste POST

### 3. Aggiungere il modulo Google Drive

1. Aggiungi un nuovo modulo dopo il webhook
2. Cerca e seleziona "Google Drive"
3. Seleziona l'azione "Upload a file"
4. Connetti il tuo account Google Drive (segui le istruzioni per l'autenticazione)
5. Configura i campi:
   - **Drive**: Seleziona "My Drive" o una cartella specifica
   - **Folder**: Seleziona la cartella dove salvare i video
   - **File Name**: Puoi usare `{{1.file.name}}` per usare il nome originale del file
   - **File Content**: Seleziona il campo `file` dal modulo webhook

### 4. Salvare e attivare lo scenario

1. Salva lo scenario
2. Attiva lo scenario cliccando sul pulsante di attivazione

## Configurazione dell'applicazione

1. Aggiungi la variabile d'ambiente `MAKE_WEBHOOK_URL` con l'URL del webhook generato da Make:

```
MAKE_WEBHOOK_URL="https://hook.eu2.make.com/your-webhook-id"
```

2. Riavvia l'applicazione

## Test dell'integrazione

1. Vai alla pagina principale dell'applicazione
2. Incolla l'URL di un reel di Instagram
3. Clicca su "Salva su Google Drive"
4. Verifica che il video appaia nella cartella selezionata su Google Drive

## Risoluzione dei problemi

- **Il video non viene salvato su Google Drive**: Controlla i log dell'esecuzione dello scenario in Make per vedere se ci sono errori
- **Errore "MAKE_WEBHOOK_URL non configurato"**: Assicurati di aver configurato correttamente la variabile d'ambiente
- **Errore nell'invio a Make**: Verifica che lo scenario in Make sia attivo e che l'URL del webhook sia corretto