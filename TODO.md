## Done
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

- Login-Logik
    - copilot soll unified-ui-core-api-client initialisieren (mit allen routes)
    - wenn user (/me) keine tenants hat, tenant erstellen und erneut /me aufrufen
    - dann user objekt überall verfügbar sein
    - dann soll user dropdown die tenants und der aktive tenant angezeigt werden
        - lokal soll gespeichert sein, welcher tenant ausgewählt ist
    - selected tenant objekt muss auch überall verfügbar sein
## TODOs

---
Entwerfe eine Component in layout/sidebar.
Nenne dieses Component SidebarDataList.

Konzept:
Wenn der Benutzer über "Applications", "Autonomous Agents", "Developmen(hier erstmal nur leere liste anzeigen, da es im be noch keine endpoints gibt)" oder "Credentials" hovert, soll dieses Component angezegt werden. Es soll direkt neben der Sidebar (selbe höhe und direkt rechts daneben) angezeigt werden.
Dieses Comonent soll die props "Header titel", "Header icon", "DataList -> interface: "liste aus obejket, die jeweils einen name und einen link haben" und OnAdd haben.

Vorbild: PowerBI Workspaces Liste, wenn man auf Workspaces in der Sidebar klickt (nur bei uns soll beim hovern aufgehen)

Component:
- Soll ein Header haben. In dem Header ist links das Icon und daneben der Namen (groß und dick); Außerdem soll ganz rechts auf der Titelhöhe noch ein "nach rechts expand/nach links verkleiner" Icon sein, welches das Component verbreitert und dann noch ein X zum schließen
- darunter soll die SearchBar sein. Diese filtert innerhalb der compoent einfach die liste und sucht die einträge
- ganz unten soll ein "Hinzufügen Button" sein
- Beim Hinzufügen Button soll dann ein Dialog aufgehen, um ein Item hinzuzufügen (jeweils Autonomous Agent, Application, Credentials)
- header und buttom sollen fixed sein und nur die liste skrollbar
- header und button sollen jeweils mit divider von liste getrennt sein
- das component soll einen leichten shadow haben, der das component nach leicht oben nach oben hervorhebt
- wenn liste leer ist, zeige dies entsprechend mit einem text (und icon?) an
- mach das component schick

Impementiere logik:
- wenn der benutzer über diese items hovert, soll das component mit den entsprechenden daten zu der Entität angezeigt werden
- wenn der benutzer über dem component ist, soll das component weiterhin angezeigt werden
wenn der benutzer auf das X Klickt, soll das component geschlossen werden
- wenn der benutzer nicht mehr über dem item in der sidebar gehovert ist oder auch nicht mehr über dem component hovert, soll dieses automatisch geschlossen werden
- wenn der Benutzer auf das Item in der Sidebar klickt, soll das component auch geschlossen werden
- wenn der Benutzer auf der Seite der Entität ist (also zB in der Sidebar auf Applications geklickt hat), soll beim hovern über applications die component NICHT angezeigt werden, da der benutzer sich ja bereits auf der seite befindet. 
- es soll nur einmal gerendert werden. sprcih, wenn der benutzer über applications hovert und dann über credentials hovert, soll nicht irgendwie versehndelich das component doppelt gerendert werden, sondern "umgeschaltet" auf die neue entity
- bitte fetche die entitäten immer mit dem parameter "top=999" (es sollen immer alle aus der DB geladen werden, damit man lokal filtern kann. im BE ist ein cache hinterlegt)
- im ersten schritt implementiere noch nicht den hinzufügen dialog. das machen wir anschließend. erstmal nur das anzeigen der component, das automatische schließen, das fetchen der daten aus dem backend mit dem api client und das lokale filtern und natürlich das design
- auch wenn du die gesamte liste hast, rendere erstmal nicht ALLE einträge sondern führe quasi lokal eine scroll-pagination auf der in-memory liste durch
- info: das component soll natürlich rechts neben der sidebar und "über" dem maincontent zusehen sein und nichts verschieben

Ziel ist es, bei diesen Entitäten es zu ermöglichen, dem benutzer ohne die seite zu wechseln, eine liste bekommt und schnell wechseln, aber auch nicht wechseln kann
---

- SideBar Hover
    - wenn man mehr als 0,3s über einem Item mit List hovert, soll neben sidebar ein fester wie bei PowerBI Workspace aufgehen mit Search und Liste, sodass man super schnell, ohne wechseln der seite, seine App, Agent, Credential oder sonst was auswählen kann
    - das als component implementieren, in welche man liste mitgibt und OnSearch action und OnSelect action...
    - BE: wenn Search filter -> search nicht cachen! das wäre zu viel! Also wenn Search Query param gegeben ist, soll nicht gecacht werden
    - bei applications, credentials, autonom agents, development gehen wir davon aus,  dass es keine mehrere tausend einträge sind, daher: EINMAL mit top 999 fetchen; dann im Frontend filtern!
    - Component:
        - Header titel + icon
        - SearchBar
        - Liste
        - Create Button
            - Create Dialog
                - inkl. IAM

- loading icon flash
- tenant hinzufügen
    - im user dropdwon> tenant dropdown

- CredentialsPage designen
- ApplicationsPage designen
    - applications fetchen und anzeigen
        - mit search, pagination, create
    - ApplicationsDetailPage
- ConversationsPage
    - hier direkt in einen Chat rein
        - oben im Chat -> Applications DropDown


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
