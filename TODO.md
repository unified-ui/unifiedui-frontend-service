## Done


## TODOs

- SettingsPage

    - custom groups
        - info wie bei Manage access
        - searchbar + filter auf rolle + Create button wie bei Manage access
        - EditDialog
            - tabs:
                - Manage Members
                - Details
                - Manage Access
            - beim klicken auf row -> ?tab=manage-members
        - tabelle
            - Spalten:
                - Name
                - Description
                - Icon: ...
                    - Edit
                    - Manage Members
                    - Delete
            - als tabelle
            - schöner
            - skrollbar
        - paginierung -> infinity scroll

- /refresh von identity implementieren
    - FE button in IAM table -> da wo das icon ganz links ist -> beim hovern hier ein refresh icon rein!

- beim wechseln des tenants
    - context leeren
        - zB sidebardatalist sind noch die bereits gefetcheten sachen dabei

- Rollen im FE beachten
    - CREATOR, ADMIN
    - TENANT manages acces etc etc

- language-support einbauen
    - erstmal alles in englisch
    - als zweites: über url /de-de /en-us übersetzen (default -> /en-us)

---

- AB HIER: CHAT UND INTEGRATION
- ConversationsPage
    - hier direkt in einen Chat rein
        - oben im Chat -> Applications DropDown


**Chat Service**

- GOLang Chat Service
- keine postgres Connection in Go App
- Rest Client für Core-Service (Platform)
- Rest Client holt Daten für Application und secrets (secret-Route) bzw. Extra Route mit gejointen Daten für den Chat Service
    - GET /platform/api/v1/tenants/{id}/applications/{id}/invoke/config
        - hier alles zusammenjoinen und als Response: header + type
- POST /chat/api/v1/tenants/{id}/chats/invoke
    - {conversation_id: str | None, edit_message_id: str | None}
    - conversations entity braucht noch "config" (können wir über spalten abbilden!):
        - history_messages_count -> 15 default
        - foreign_conversation_id
        - ...

- wenn RUN durch (ob fail oder nicht), wird tracing service aufgerufen -> 202 ACCEPTED

- N8N Integration
    - config:
        - use unified-ui chat history (Togglebutton) + HistoryChatMessages (15; aber in invoke; damit konfigurierbar!)
        - 

*Additional:*
- man kann nur die LETZTE Nachricht bearbeiten
- traces
    - message traces werden werden IMMER über den Consumer ingestet! also bei message invokation -> am ende ein event senden
    - traces eimal nach unserem Schema einblenden über Popup; mit tabbar auch per iframe den foreign trace einblenen
        - foreign trace:
            - n8n -> Workflow
- types beim streamen weitergeben (zB AgentMessage, AskQuestion Action, ...)
- Widgets:
    - iFrame Widget
        - Externe Seite / Formular in Canvas embedden
        - über query Params config mitgeben
        - callback url für annahme von Daten
        - iframe.contentWindow.postMessage -> übergabe des user-tokens
            - ref: [Link to ref](https://chatgpt.com/c/6951ae1e-c968-8332-a774-b46a8d08235c)
            - oder -> useMsal
    - fertige Widgets
        - Ja / Nein
        - Multi-Select Options
        - Single-Select Options
    - Widgets designen
        - einfaches Formular mit jeglichen Datentypen configurieren
    - LLM soll nur ausgeben: $%_WIDGET:ID=id-of-widget:WIDGET_%$
    

```json
/*
Da sowieso alle Systeme über REST angesprochen werden,
können wir hier einfach den header zurückgeben (und aggessiv cachen!).
*/
{
    "type": "N8N",
    "headers": {
        ...
    }
}
```

- Widget Registry

**Tracing-API-Service**

Simpler, aber performanter Service für die validierung der Anfrage und das erstellen von events bzw. bei custom traces -> direkt in docdatabase schreiben und dem zurückgeben der traces

- POST /api/v1/tenants/{id}/conversations/{id}/messages/{id}/traces
    ```json
    {
        "reference_id"?: "{id-of-tracing-store}",
        "data"?: {...}
    }
    ```
    - (type bekommt man über application)
    - entweder reference_id oder data
        - reference_id -> wenn event 
            - 202 ACCEPED + {"status_url": "/api/v1/tenants/{id}/conversations/{id}/messages/{id}/traces" -> status steht im Objekt}
            - objekt wird in docdatabase erstellt
                - _id, reference_id, type und config wird an event gegeben (keine sensitiven Daten!)
        - data -> wenn man die daten direkt speichern möchte
            - data-schema wird direkt validiert
            - und direkt gespeichert
    
- GET /api/v1/tenants/{id}/conversations/{id}/messages/{id}/traces
    - tracing daten UND Job-Status
    ```json
    {
        "id": "{uuid}",
        "reference_id": "{reference-id-with-index}",
        "entity_type": "{entity-type-with-index-for-optimized-search-with-reference-id}",
        "job": {
            "type": "DIRECT|EVENT",
            "status": "PENDING|IN_PROCESS|SUCCESS|FAILED",
            "message": "",
            "error": "NULL|Message",
            "createdAt": "{TIMESTAMP}",
            "finishedAt": "{TIMESTAMP}",
            "request": {
                "data": {},
                "reference_id": ""
            },
            "event": {
                "autonomous_agent_id": "{id}",
                "application_id": "{id}",
                "conversation_id": "{id}",
                "credential_id": "{id}",
                "type": "N8N|MICROSOFT_FOUNDRY|..."
            }
        },
        "tracing": {...}
    }
    ```

- GO Service
- connection zu docdatabase
- REST API zum ingestion der traces
    - Aufgabe:
        - übernimmt die validierung der Anfrage
        - gibt 202 ACCEPED + status url (traces/{trace_id}/status) zurück (oder 400er oder 500er zurück)
            - event geschrieben wird gefeuert
    - N8N Traces anbinden -> /executions
    - Foundry Traces anbinden -> Foundry SDK
    - Custom Traces anbinden -> hier vorgegebenes Format -> kann direkt gespeichert werden
        - 201er oder 400er oder 500er
- Auch Cache! lange TTL für traces, da diese sich nie verändern

**Tracing-Ingestion-Service**

...

**Design**
- Wenn man in Application reingeht -> direkt chat öffnen
- Wenn man in Conversations reingeht -> direkt in chat öffnen
- Chat hat oben einen header
    - dort kann man in DropDown feld auch die Application Wechseln (dann automatisch neuer Chat)

**Zukunft**
- caching strategie optimieren
    - ttl im Backend bei den resourcen optimieren! (länger oder kürzer)
    - ...
- Consumer Ingestion Service
    - core code und auch als Azure Serverless Function bereitstellen
- favorieten-feature implementieren
    - FE: favorieten einmal fetchen beim öffnen und dann global im state speichern
    - sidebardatalist -> hier ein Pin-Symbol hinzufügen und lokal ordnen
    - in liste -> auch Pin-Symbol hinzufügen
    - lokal immer die pins oben zeigen -> dann die fetch results entsprechend filtern (am besten in einer zentralen component)
    - beim sortieren -> Pins lokal sortieren nach logik!
- im userdropdown > Refresh my Credentials -> cache leeren für user
- gesamtes Backend refactoren
    - zentrale helper functions für:
        - principals (permissions) hinzufügen (nicht tenants)
        - tags hinzufügen
        - user favorites
- gesamtes Frontend refactoren
- multi-azure/google-tenant
    - in principals tabelle noch identity_provider (EXTRA_ID, GCP, AWS etc) aufnehmen
    - mit der vollen email, soll man auch azure-user aus anderen tenants berechtigen können
    - auch google accounts etc einladen können
- private azure deployment
- Env-Deployment mit anpassung der variablen
    - von zB N8N oder Foundry
        - N8N -> download json -> map variables -> upload json
