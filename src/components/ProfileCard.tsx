import { useMsal } from "@azure/msal-react";
import { useState, useEffect } from "react";
import "./ProfileCard.css";

interface UserProfile {
  name: string;
  email: string;
  id: string;
}

export const ProfileCard = () => {
  const { instance, accounts } = useMsal();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Benutzerprofil und Token laden
  useEffect(() => {
    const loadUserData = async () => {
      if (accounts.length > 0) {
        const account = accounts[0];
        
        // Profildaten aus dem Account extrahieren
        setProfile({
          name: account.name || "Unbekannt",
          email: account.username || "Keine E-Mail",
          id: account.localAccountId || account.homeAccountId,
        });

        // Access Token abrufen
        try {
          const response = await instance.acquireTokenSilent({
            scopes: [
                "User.Read",
                "User.ReadBasic.All",
                "GroupMember.Read.All",
                "Group.Read.All"
            ],
            account: account,
          });
          setToken(response.accessToken);
        } catch (error) {
          console.error("Token konnte nicht abgerufen werden:", error);
        }
      }
    };
    loadUserData();
  }, [accounts, instance]);

  const handleLogout = () => {
    instance.logoutPopup();
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!profile) {
    return <div>Lade Profil...</div>;
  }

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <h2 className="profile-name">{profile.name}</h2>
      </div>
      
      <div className="profile-info">
        <div className="info-item">
          <label>E-Mail:</label>
          <span>{profile.email}</span>
        </div>
        <div className="info-item">
          <label>Name:</label>
          <span>{profile.name}</span>
        </div>
        <div className="info-item">
          <label>ID:</label>
          <span className="user-id">{profile.id}</span>
        </div>
      </div>

      <div className="token-section">
        <label>Access Token:</label>
        <div className="token-display">
          <code>{token.substring(0, 40)}...</code>
          <button 
            className={`copy-button ${copied ? 'copied' : ''}`}
            onClick={copyToken}
          >
            {copied ? '✓ Kopiert' : 'Kopieren'}
          </button>
        </div>
      </div>

      <button className="logout-button" onClick={handleLogout}>
        Abmelden
      </button>
    </div>
  );
};
