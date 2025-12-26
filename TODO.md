## Done

## TODOs

- Standard List Page designen
    - Paginierung raus und dafür Doom-Scroll bis liste leer ist
    - search by name (ohne cache)
    - filter by
        - tags
        - is active all, active, inactive
    - is active switch anzeigen
    - type anzeigen -> aktuell zB Chat Agent -> n8n oder MSF Foundry oder ... halt type
    - tags ansicht
        - mehr Tags anzeigen; besser anzeigen
        - tool-tip viel schöner (mit container; wrapped etc)
        - tag hinzufügen button anzeigen -> mit dialog?
    - Hover:Hand-Cursor
    - kontext-menü (drei punkte)
        - Edit hinzufügen
        - Pin item / Unpin item
    - beim skrollen -> oben sieht man die liste...

- aktuelle pages aktualisieren (wenn nötig)

- Standard Detail-Page + Edit designen
    - Tab-Bar:
        - Details
        - IAM

- favorieten-feature implementieren
    - FE: favorieten einmal fetchen beim öffnen und dann global im state speichern
    - sidebardatalist -> hier ein Pin-Symbol hinzufügen und lokal ordnen
    - in liste -> auch Pin-Symbol hinzufügen
    - lokal immer die pins oben zeigen -> dann die fetch results entsprechend filtern (am besten in einer zentralen component)
    - beim sortieren -> Pins lokal sortieren nach logik!

- Development-Platform (route in `development-platforms` umbenennen)
    - Page erstellen
    - Dialog erstellen
    - n8n hinzufügen
    - Dev-Page anzeigen /development-platforms/{id}

- Chat-Widgets
    - Page hinzufügen (comming soon)
    - SidebarItem hinzufügen

- SettingsPage
    - tenant settings
        - name -> rename
        - Delete Tenant
    - IAM
    - Custom Groups
    - Billing & Licence
    - => über **TabNavigation** oder SideBar?
        - Tenant Settings
        - IAM
        - Custom Groups

- CredentialsPage deisgnen
- ApplicationsPage designen

---

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

**Zukunft**
- caching strategie optimieren
    - ttl im Backend bei den resourcen optimieren! (länger oder kürzer)
    - ...
- im userdropdown > Refresh my Credentials -> cache leeren für user
- gesamtes Backend refactoren
    - zentrale helper functions für:
        - principals hinzufügen (nicht tenants)
        - tags hinzufügen
        - user favorites
- gesamtes Frontend refactoren
