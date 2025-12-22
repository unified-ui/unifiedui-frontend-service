
**TODOs:**
1. Design Themes vorbereiten
2. copilot-instructions:
    - projektbeschreibung hinzufügen
        - einmal inhaltlich (was ist unified-ui)
        - einmal zum react projekt
    - react structure und design themes datei verlienken
    - react best practice 
3. LoginPage erweiter
    - hier noch mehr content u.a. kurze projektbeschreiung
    - geiles background mit animation bezogen auf ai und bewegt sich

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
