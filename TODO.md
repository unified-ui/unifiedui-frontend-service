## Done

- Backend:
    - neue Tabellen: principals
        - tenant_id, principal_id, mail, display_name, principal_id
            - tenant_id + principal_id als PK
            - mail leer bei gruppen; 
        - eine route: PUT identity/principals/{id}/refresh {type: IDENTITY_USER|IDETNTITY_GROUP}
            - soll identity hinzufügen bzw neu getchen und updaten
        - custom_groups soll in dieselbe Tabelle geschrieben werden
            - im IdentityUser wird nicht mehr unter custom groups und identity groups unterschieden
                - sondern über type bekommt man den korrekten type!
                - jetzt kann man die rolle des prinicpals (gruppe und custom gruppe) driket mit fetchen und kann tenant roles besser auslesen
                - jetzt kommen in den benutzer nur noch die identity groups, die auch in der App genutzt werden! (aus principals)
        - überall, wo principal_id oder user_id ist
            - soll gecheckt werden -> existiert principal? wenn nein -> hinzufügen
        - dann müssen permission check angepasst werden
            - können nun viel effizienter gefetcht werden
    - bei den /principals routes
        - sollen principals immer rangejoint werden
    - tests etc refactoren
    - bei LIST -> ohne metadaten und nur wichtige Daten ausgeben
        - ggf ?view=quick-list -> dann nur id+name
    - aktuell ist bei order_by und is_active -> kein cache
        - aber order by + order direction und is_active sollen auch gecacht werden!
    - tests refactoren:
        - ich habe felder hinzugefügt. die CREATE, PUT/PATCH logik muss in handlern implementiert sein und in den tests getestet sein -> prüfen!
    - Backend eindockern und lokal ins docker compose übernehmen und über docker compose starten (inkl. restart!)

    - custom groups
        - created by und updated by ist null
        - TODO: review der tests MIT created_by und updated_by -> current user id
        - dann alle die fehlschlagen -> handler fixen!
    - FE: login/token page -> um token zu sehen
    - app zum laufen bringen
    - get_me() testen
        - bekomme ich tenants + rollen im tenant?
## TODOs


- client.ts und responses etc anpassen und erweitern
    - view=quick-list -> für die sidebardatalist
    - PUT identity/principals/{id}/refresh

- Development-Platform
    - Dialog erstellen
    - Page erstellen

- Chat-Widgets
    - Page hinzufügen (comming soon)
    - SidebarItem hinzufügen

- Paginierung raus und dafür Doom-Scroll bis liste leer ist
- Search implementieren (soll wirklich gegen API search gehen)
- Sort by implementieren (default -> last updated)
- Filter implementieren (by tags and status)
- Table mit nötigen Daten ausstatten
    - is_active switch
    - tags
    - hover -> Hand
    - beim skrollen -> oben sieht man die liste...
- UserDropdown > Tenants nach A-Z sortieren

- SettingsPage
    - tenant settings
        - name -> rename
        - Delete Tenant
    - IAM
    - Custom Groups
    - Billing & Licence
    - => über **TabNavigation** oder SideBar?
- CredentialsPage deisgnen
    - ...
- ApplicationsPage designen
    - ApplicationsDetailPage
        - IAM
        - UPDATE

- AB HIER: CHAT UND INTEGRATION
- ConversationsPage
    - hier direkt in einen Chat rein
        - oben im Chat -> Applications DropDown

- Widget Registry

**Design**
- Wenn man in Application reingeht -> direkt chat öffnen
- Wenn man in Conversations reingeht -> direkt in chat öffnen
- Chat hat oben einen header
    - dort kann man in DropDown feld auch die Application Wechseln (dann automatisch neuer Chat)

**Frontend Entwicklung**

- Ein Design in einer FRONTEND/* mit Copilot ausarbeiten
    - mehrere Dateien, sodass man nach und nach implementieren und updaten kann
        - STRUCTURE.md (beschreibung der Projektstruktur)
        - COLOR_DESIGN.md (color theme etc)
        - PAGES.md (beschreibung)
        - PAGES/*
            - LOGIN_PAGE.md
            - ...
        - COMPONENTS/*
            - BUTTON.md
            - TOAST.md
            - MESSAGEBOX.md (so rechts oben als alert)
    - dieses design sehr gut beschreiben und mit Copilot in the Loop ausarbeiten
    - anschließend das Desgin mit Copilot erstellen, inkl. BE-Transaktionen

- Design ausarbeiten
    - hier fotos suchen / pinterest / design sachen
    - Design
        - Colors (Dark- und Light-Mode)
            - vieleicht Schwarz und Gift-Grün? sowas in die richtig
            - fest definierten Farb-Satz, den man ggf anpassne kann (nicht zu viele)
            - über ENV soll man sagen, welches Color-Theme man nutzen möchte
                - also Color-Theme dynamisch halten (und immer Light-Dark-Mode)
    - Layout Design
        - Header (rechts oben mit Profil + Tenants als DropDown + notifications icon)
    - Eine Best-Practice Projekt-Struktur aufbauen
        - Copilot-Instructions bauen
        - Struktur aufbauen
    - Components bauen
        - Framework mit Copilot auswählen
        - Standard Components aufbauen
            - Buttons
            - Toasts
                - types: DELETE, ?
            - DropDowns (searchable)
            - checkboxen
            - Toggle Buttons
            - TextBoxen
            - ???
        - LayoutComponents abuen
            - Sidebar
            - Header
            - MainLayout
    - Pages bauen
        - LoginPage
            - beim einloggen: wenn Benutzer keinen Tenant hat -> wird ein "default" erstellt
        - Dashboard Page
            - Kontept entwickeln
                - meine letzten Konversationen
                - meine letzten Applications
                - meine letzten Autonomen Agents
                - meine Favoriten (Applications, AutoAgents)
        - CredentialsPage
            - Liste
            - Details
                - Access (Als OverLay)
            - Form + Test-Connection
        - TenantSettings
            - IAM
                - Tenant Access
                - Custom Groups
        - ApplicationsPage
            - Liste
            - Details
                - Access (Als Overlay)
                - Liste Conversations
                    - Details / Messages
                        - Access
                        - Messages
            - Form + Credentials direkt dort anlegbar (mit default namen)
        - ConversationsPage
            - als Komponente -> einmal unter Application
            - einmal als page um alle conversations zu sehen
        - Autonomous Agents
            - Liste
            - Details
            - Tracing History
                - Liste
                - Details
        - Widget Designer
            - hier nur Placeholder

**Zukunft**
- im userdropdown > Refresh my Credentials -> cache leeren für user
- gesamtes Backend refactoren
    - zentrale helper functions für:
        - principals hinzufügen (nicht tenants)
        - tags hinzufügen
        - user favorites
- gesamtes Frontend refactoren
