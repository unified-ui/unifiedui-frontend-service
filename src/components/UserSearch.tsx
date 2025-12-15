import { useMsal } from "@azure/msal-react";
import { useState, useEffect } from "react";
import "./UserSearch.css";

interface User {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

export const UserSearch = () => {
  const { instance, accounts } = useMsal();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Benutzer von Microsoft Graph laden
  useEffect(() => {
    const fetchUsers = async () => {
      if (accounts.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        // Token abrufen
        const response = await instance.acquireTokenSilent({
          scopes: ["User.ReadBasic.All"],
          account: accounts[0],
        });

        // Microsoft Graph API aufrufen
        const graphResponse = await fetch(
          "https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName&$top=999",
          {
            headers: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          }
        );

        if (!graphResponse.ok) {
          throw new Error(`API Fehler: ${graphResponse.status}`);
        }

        const data = await graphResponse.json();
        setUsers(data.value);
        setFilteredUsers(data.value);
      } catch (err) {
        console.error("Fehler beim Laden der Benutzer:", err);
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [instance, accounts]);

  // Suchfunktion
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.displayName?.toLowerCase().includes(term) ||
        user.mail?.toLowerCase().includes(term) ||
        user.userPrincipalName?.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchTerm("");
  };

  if (loading) {
    return <div className="user-search-loading">Lade Benutzer...</div>;
  }

  if (error) {
    return (
      <div className="user-search-error">
        <p>Fehler beim Laden der Benutzer:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="user-search-container">
      <h3>Benutzer suchen</h3>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="Benutzer suchen (Name oder E-Mail)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <div className="search-results">
            {filteredUsers.length === 0 ? (
              <div className="no-results">Keine Benutzer gefunden</div>
            ) : (
              filteredUsers.slice(0, 10).map((user) => (
                <div
                  key={user.id}
                  className="search-result-item"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="user-name">{user.displayName}</div>
                  <div className="user-email">{user.mail || user.userPrincipalName}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="dropdown-container">
        <label htmlFor="user-select">Oder aus Liste wählen:</label>
        <select
          id="user-select"
          className="user-dropdown"
          value={selectedUser?.id || ""}
          onChange={(e) => {
            const user = users.find((u) => u.id === e.target.value);
            if (user) setSelectedUser(user);
          }}
        >
          <option value="">-- Benutzer auswählen --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName} ({user.mail || user.userPrincipalName})
            </option>
          ))}
        </select>
      </div>

      {selectedUser && (
        <div className="selected-user">
          <h4>Ausgewählter Benutzer:</h4>
          <div className="selected-user-details">
            <p><strong>Name:</strong> {selectedUser.displayName}</p>
            <p><strong>E-Mail:</strong> {selectedUser.mail || selectedUser.userPrincipalName}</p>
            <p><strong>ID:</strong> {selectedUser.id}</p>
          </div>
        </div>
      )}

      <div className="user-count">
        {filteredUsers.length} von {users.length} Benutzern
      </div>
    </div>
  );
};
