import React from 'react';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { apiFetch, getSession, saveSession } from '../services/api';

const ProfilePage: React.FC = () => {
  const session = getSession();
  const user = session?.user;

  const handleLogout = async () => {
    if (session?.refreshToken) {
      try {
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
      } catch {
        // Ignorar errores de red al cerrar sesión
      }
    }
    saveSession(null);
  };

  if (!user) return null;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Mi Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: 560, margin: '16px auto' }}>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                {user.username}{' '}
                <IonBadge color={user.role === 'Admin' ? 'warning' : 'primary'}>{user.role}</IonBadge>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonLabel>
                    <h3>Correo Electrónico</h3>
                    <p>{user.email}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <h3>Fecha de Nacimiento</h3>
                    <p>{user.birthDate}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <h3>Estado de Cuenta</h3>
                    <p>{user.isActive ? 'Activa' : 'Desactivada'}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <h3>Fecha de Registro</h3>
                    <p>{new Date(user.createdAtUtc).toLocaleString()}</p>
                  </IonLabel>
                </IonItem>
              </IonList>

              <IonButton expand="block" color="danger" onClick={handleLogout} style={{ marginTop: 20 }}>
                Cerrar Sesión
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;