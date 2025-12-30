## Done

## TODOs

bugs:
- add access dialog
    - kein icon! -> manage access icon hinzufügen im titel links
    - beim inputfeld -> search icon bleibt nicht links wenn man item (principal) hinzufügt
    - bei den checkboxen -> nur links beim text auswählbar, nicht auf gesamten container der checkbox
    - labels im dropdow (Identity Users, Identity Groups Custom Groups):
        - dick + größer
        - keine hintergrundfarbe

- Standard Detail-Page + Edit designen
    - Tab-Bar:
        - Details
            - Edit Button oben -> dann wird form freigegeben
            - wenn man auf "Edit" drück, wird direkt edit freigegeben (über queryparam: view=display|edit (None = display))
        - IAM
            - Liste (an IDENTITY_USER/GROUP kann man "Refresh Entity" icon sehen und drücken)
            - CheckBoxen in Tabelle -> READ, WRITE, ADMIN mit Beschreibung beim hovern
            - Hinzufügen -> Dialog; multiple inputs wie bei tags
            - Entfernen (bei drei punkten)

- Quick-IAM beim Manage Access aus dropdown

- Development-Platform (route in `development-platforms` umbenennen)
    - Page erstellen
    - Dialog erstellen
    - n8n hinzufügen
    - Dev-Page anzeigen /development-platforms/{id}

- Chat-Widgets
    - Page hinzufügen (comming soon)
    - SidebarItem hinzufügen

- SettingsPage
    - **TabNavigation**
        - Tenant Settings
        - IAM
        - Custom Groups
        - Billing & Licence
    - tenant settings
        - name -> rename
        - Delete Tenant
    - IAM
    - Custom Groups
    - Billing & Licence

- CredentialsPage deisgnen
- ApplicationsPage designen

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
