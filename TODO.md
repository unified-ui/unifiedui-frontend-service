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

Entwickle modular mehrere Components.
Diese Komponenten sollen gemeinsam eine Standard Page abbilden, aber auch einzeln einsetzbar sein.

1. Es soll ein Container geben, der normalen responsve design pattern folgt, aber nicht über die gesamte page geht. mit gesamte page werde ich meinen, die pages werden in das layout als content (zwischen header und sidebar) eingebaut und der rest ist content. aber der container soll eine max width haben und dann sich entsprechend der breite anpassen.
2. PageHeader: Dieser besteht aus
- links oben einem titel in groß und dick; darunter eine beschreibung der seite (alles englisch).
- einem Create {Entity} button rechts auf höhe des titels
3. Einer Art Tabelle. diese soll listen einträge haben. links soll der Name und die description untereinander sein. Name in dick und recht groß, description darunter als secondary. die nächste spalte (oder wie auch immer du es designst) ist der Typ (column: type). Typ kann aber auch nicht gegeben sein, also im interface für die übergabe der daten, ist typ und description optional. Dann kann das item mehrere tags haben. diese sollen auch in so kästen mit angezeigt werden. aber maximal 3 und dann "..." und beim hovern soll man alle in einer art tool tip sehen können. zudem kann es ein Status (is_active) geben, welcher is_active. Hierfür sollte ein Switch-Button (also True False) als nächstes erscheinen. Ganz rechts drei punkte typbol für einen dialog. im dialog soll "öffnen", "Share", "Duplicate" und "Delete" stehen.
Du hast jetzt gehört, was in die tabelle soll. Wenn du eine sehr gute idee für einen sauberen, kurzen überblick hast, kannst du auch eine alternative struktur bauen.
4. über der tabelle soll eien search bar sein (erstmal ohne logik), daneben ein sort dropdown (mit den einträgen "Sort by last updated" (default), "Sort by last created", "Sort by name A-Z" und "Sort by name Z-A") und daneben ein Filter-Button, bei welchem ein dialog aufgehet (also direkt unter dem button) mit den filtern: "tags" (ein multi-select searchable dropdown) und "status" dropdown ("All" (default), "Active", "Passiv")
5. unter der Tabelle dann eine typische pagination:
- total count (on page), pages, go to next/prev; go to first/last) und dropdown mit "25/page" "50/page" (default), "100/page"

die tabellen-componenten sollen in eine component und die pageheader component brauche ich. den container haben wir mit dem ui framework ja, musst du nur implementieren.

so. baue nun diese komponenten und richte sie auf den Seiten:
- applications (chat agents)
- Autonomous Agents
- und credentials ein

- Standard Page designen
    - bei n8n inspirieren lassen
    - Filter
        - Search
        - Sort DropDown
            - last updated
            - created
            - Sort by Name A-Z
            - Sort by Name Z-A

        - FilterIcon DropDown
            - Tags
                - multi tag filter select
            - status
- Backend:
    - development_platforms als Entity und Routes hinzufügen
        - name, description, type (Freitext, optional), iframe_url
    - chat_widgets
        - name, descriptions, type (enum: [iframe, form], required), config (json, required) + metadatenfelder
    - Felder einführen:
        - status (is_active)
        - tags
        - checken: ist auth wirklich in routes und nicht in den handlern?
            - tags -> hier muss man anpassen!
        - principal_favorites -> auf applications, autonome agents, conversations, development_platforms
    - search query param überall rein
        - wenn search-qp -> kein Caching
    - pagination ordentlich implementieren
        - default top = 100; max 999
    - Applications:
        - neues Pflichtfeld: type (enum: N8N, MICROSOFT_FOUNDRY, REST_API)
    - order_by als query param überall mitgeben (einfach order_by=created_at&sort=ASC)
        - last updated
        - last created
        - Sort by Name A-Z
        - Sort by Name Z-A
- tags
    - hier neues Tag-Component
- Create-Dialoge updaten
- Standard Pages implementieren
    - ApplicationsPage
    - CredentialsPage designen

- sidebarDataList
    - die list-resultate sollen global verfügbar bleiben
    - wenn einmal gefetcht, nicht nochmal fetchen (erst nach Create)
    - aber ein Refresh-Button rechts neben Search

- Divider zwischen credential und chat-widgets/dev-platform

## TODOs

- Backend:
    - neue Tabellen: principals
        - tenant_id, principal_id, mail, display_name, principal_id
            - tenant_id + principal_id als PK
            - mail leer bei gruppen; 
        - überall, wo principal_id oder user_id ist
            - soll fk
            - soll gecheckt werden -> existiert principal? wenn nein -> hinzufügen
        - eine route: PUT identity/principals/{id}/refresh {type: IDENTITY_USER|IDETNTITY_GROUP}
            - soll identity hinzufügen bzw neu getchen und updaten
        - custom_groups soll in dieselbe Tabelle geschrieben werden
            - dann müssen permission check angepasst werden
                - können nun viel effizienter gefetcht werden
            - im IdentityUser wird nicht mehr unter custom groups und identity groups unterschieden
                - sondern über type bekommt man den korrekten type!
                - jetzt kann man die rolle des prinicpals (gruppe und custom gruppe) driket mit fetchen und kann tenant roles besser auslesen
                - jetzt kommen in den benutzer nur noch die identity groups, die auch in der App genutzt werden! (aus principals)
    - bei den /principals routes
        - sollen principals immer rangejoint werden

    - bei LIST -> ohne metadaten und nur wichtige Daten ausgeben
        - ggf ?view=quick-list -> dann nur id+name
    - Backend eindockern und lokal ins docker compose übernehmen und über docker compose starten (inkl. restart!)

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
