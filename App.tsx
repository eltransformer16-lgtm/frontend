import React, { useEffect, useState } from 'react';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { folderOutline, peopleOutline, personCircleOutline } from 'ionicons/icons';
import { Redirect, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import StoragePage from './pages/StoragePage';
import AdminUsersPage from './pages/AdminUsersPage';
import ProfilePage from './pages/ProfilePage';
import { AuthSession, getSession } from './services/api';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(() => getSession());

  useEffect(() => {
    const sync = () => setSession(getSession());
    window.addEventListener('auth-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('auth-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!session) {
    return (
      <IonApp>
        <LoginPage />
      </IonApp>
    );
  }

  const isAdmin = session.user.role === 'Admin';

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/storage" component={StoragePage} />
            {isAdmin && <Route exact path="/admin/users" component={AdminUsersPage} />}
            <Route exact path="/profile" component={ProfilePage} />
            <Route exact path="/">
              <Redirect to="/storage" />
            </Route>
            <Route>
              <Redirect to="/storage" />
            </Route>
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="storage" href="/storage">
              <IonIcon icon={folderOutline} />
              <IonLabel>Archivos</IonLabel>
            </IonTabButton>

            {isAdmin && (
              <IonTabButton tab="users" href="/admin/users">
                <IonIcon icon={peopleOutline} />
                <IonLabel>Usuarios</IonLabel>
              </IonTabButton>
            )}

            <IonTabButton tab="profile" href="/profile">
              <IonIcon icon={personCircleOutline} />
              <IonLabel>Perfil ({session.user.username})</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;