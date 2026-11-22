import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { API_BASE, AuthSession, parseError, saveSession } from '../services/api';

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login state
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('2000-01-01');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail.trim(),
          password: loginPassword,
        }),
      });

      if (!res.ok) {
        setErrorMsg(await parseError(res));
        return;
      }

      const data = (await res.json()) as AuthSession;
      saveSession(data);
    } catch {
      setErrorMsg('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== passwordConfirm) {
      setErrorMsg('La contraseña y su confirmación no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          passwordConfirm,
          birthDate,
        }),
      });

      if (!res.ok) {
        setErrorMsg(await parseError(res));
        return;
      }

      const data = await res.json();
      setSuccessMsg(
        data?.message ||
          'Cuenta registrada. Espera a que un administrador active tu usuario antes de iniciar sesión.'
      );
      setUsername('');
      setEmail('');
      setPassword('');
      setPasswordConfirm('');
      setMode('login');
    } catch {
      setErrorMsg('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Sistema de Gestión y Archivos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: 480, margin: '24px auto' }}>
          <IonCard>
            <IonCardHeader>
              <IonCardSubtitle>Control de Acceso</IonCardSubtitle>
              <IonCardTitle>{mode === 'login' ? 'Iniciar Sesión' : 'Registro de Usuario'}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonSegment
                value={mode}
                onIonChange={(e) => {
                  setMode(e.detail.value as 'login' | 'register');
                  setErrorMsg('');
                }}
              >
                <IonSegmentButton value="login">
                  <IonLabel>Entrar</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="register">
                  <IonLabel>Registrarse</IonLabel>
                </IonSegmentButton>
              </IonSegment>

              {errorMsg && (
                <div style={{ marginTop: 14, padding: 10, borderRadius: 8, background: 'rgba(235,68,90,0.15)' }}>
                  <IonText color="danger">{errorMsg}</IonText>
                </div>
              )}

              {successMsg && (
                <div style={{ marginTop: 14, padding: 10, borderRadius: 8, background: 'rgba(45,211,111,0.15)' }}>
                  <IonText color="success">{successMsg}</IonText>
                </div>
              )}

              {mode === 'login' ? (
                <form onSubmit={handleLogin} style={{ marginTop: 16 }}>
                  <IonItem>
                    <IonInput
                      label="Usuario o Correo"
                      labelPlacement="stacked"
                      value={usernameOrEmail}
                      onIonInput={(e) => setUsernameOrEmail(e.detail.value ?? '')}
                      required
                    />
                  </IonItem>

                  <IonItem>
                    <IonInput
                      label="Contraseña"
                      labelPlacement="stacked"
                      type="password"
                      value={loginPassword}
                      onIonInput={(e) => setLoginPassword(e.detail.value ?? '')}
                      required
                    />
                  </IonItem>

                  <IonButton expand="block" type="submit" disabled={loading} style={{ marginTop: 20 }}>
                    {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                  </IonButton>
                </form>
              ) : (
                <form onSubmit={handleRegister} style={{ marginTop: 16 }}>
                  <IonItem>
                    <IonInput
                      label="Nombre de Usuario"
                      labelPlacement="stacked"
                      value={username}
                      onIonInput={(e) => setUsername(e.detail.value ?? '')}
                      required
                    />
                  </IonItem>

                  <IonItem>
                    <IonInput
                      label="Correo Electrónico"
                      labelPlacement="stacked"
                      type="email"
                      value={email}
                      onIonInput={(e) => setEmail(e.detail.value ?? '')}
                      required
                    />
                  </IonItem>

                  <IonItem>
                    <IonInput
                      label="Fecha de Nacimiento"
                      labelPlacement="stacked"
                      type="date"
                      value={birthDate}
                      onIonInput={(e) => setBirthDate(e.detail.value ?? '')}
                      required
                    />
                  </IonItem>

                  <IonItem>
                    <IonInput
                      label="Contraseña (mínimo 8 caracteres)"
                      labelPlacement="stacked"
                      type="password"
                      value={password}
                      onIonInput={(e) => setPassword(e.detail.value ?? '')}
                      required
                    />
                  </IonItem>

                  <IonItem>
                    <IonInput
                      label="Confirmar Contraseña"
                      labelPlacement="stacked"
                      type="password"
                      value={passwordConfirm}
                      onIonInput={(e) => setPasswordConfirm(e.detail.value ?? '')}
                      required
                    />
                  </IonItem>

                  <IonButton expand="block" type="submit" disabled={loading} style={{ marginTop: 20 }}>
                    {loading ? 'Registrando...' : 'Crear Cuenta'}
                  </IonButton>
                </form>
              )}
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;