import React, { useCallback, useEffect, useState } from 'react';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonPage,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/react';
import { apiFetch, getSession, parseError, UserProfile } from '../services/api';

const AdminUsersPage: React.FC = () => {
  const currentUser = getSession()?.user;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filters
  const [filterUsername, setFilterUsername] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('1995-01-01');
  const [newRole, setNewRole] = useState<'User' | 'Admin'>('User');
  const [newIsActive, setNewIsActive] = useState(true);

  // Edit Modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editRole, setEditRole] = useState<'User' | 'Admin'>('User');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');

  const loadUsers = useCallback(async () => {
    setErrorMsg('');
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (filterUsername.trim()) params.set('username', filterUsername.trim());
    if (filterEmail.trim()) params.set('email', filterEmail.trim());
    if (filterRole) params.set('role', filterRole);
    if (filterStatus) params.set('isActive', filterStatus);

    const res = await apiFetch(`/users?${params.toString()}`);
    if (!res.ok) {
      setErrorMsg(await parseError(res));
      return;
    }
    const data = await res.json();
    setUsers(data.items || []);
    setTotal(data.total || 0);
  }, [page, filterUsername, filterEmail, filterRole, filterStatus]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFeedback('');

    const res = await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify({
        username: newUsername.trim(),
        email: newEmail.trim(),
        password: newPassword,
        birthDate: newBirthDate,
        role: newRole,
        isActive: newIsActive,
      }),
    });

    if (!res.ok) {
      setErrorMsg(await parseError(res));
      return;
    }

    setShowCreate(false);
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setFeedback('Usuario creado correctamente.');
    loadUsers();
  };

  const openEdit = (u: UserProfile) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditEmail(u.email);
    setEditBirthDate(u.birthDate);
    setEditRole((u.role === 'Admin' ? 'Admin' : 'User'));
    setEditIsActive(u.isActive);
    setEditPassword('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setErrorMsg('');
    setFeedback('');

    const payload: Record<string, unknown> = {
      username: editUsername.trim(),
      email: editEmail.trim(),
      birthDate: editBirthDate,
      role: editRole,
      isActive: editIsActive,
    };
    if (editPassword.trim()) {
      payload.newPassword = editPassword;
    }

    const res = await apiFetch(`/users/${editingUser.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setErrorMsg(await parseError(res));
      return;
    }

    setEditingUser(null);
    setFeedback('Usuario actualizado correctamente.');
    loadUsers();
  };

  const toggleActiveQuick = async (u: UserProfile) => {
    setErrorMsg('');
    setFeedback('');
    const res = await apiFetch(`/users/${u.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (!res.ok) {
      setErrorMsg(await parseError(res));
      return;
    }
    setFeedback(`Usuario ${u.username} ${!u.isActive ? 'activado' : 'desactivado'}.`);
    loadUsers();
  };

  const handleRevokeToken = async (u: UserProfile) => {
    setErrorMsg('');
    setFeedback('');
    const res = await apiFetch(`/users/${u.id}/revoke-token`, { method: 'POST' });
    if (!res.ok) {
      setErrorMsg(await parseError(res));
      return;
    }
    setFeedback(`Refresh Token de ${u.username} revocado.`);
    loadUsers();
  };

  const handleDelete = async (u: UserProfile) => {
    if (!window.confirm(`¿Eliminar permanentemente al usuario "${u.username}"?`)) return;
    setErrorMsg('');
    setFeedback('');
    const res = await apiFetch(`/users/${u.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setErrorMsg(await parseError(res));
      return;
    }
    setFeedback(`Usuario ${u.username} eliminado.`);
    loadUsers();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Administración de Usuarios</IonTitle>
          <IonButton slot="end" fill="solid" color="light" onClick={() => setShowCreate(true)}>
            + Nuevo Usuario
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {errorMsg && (
          <IonCard color="danger">
            <IonCardContent>{errorMsg}</IonCardContent>
          </IonCard>
        )}
        {feedback && (
          <IonCard color="success">
            <IonCardContent>{feedback}</IonCardContent>
          </IonCard>
        )}

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Filtros de Búsqueda ({total} registros)</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="3">
                  <IonInput
                    label="Usuario"
                    labelPlacement="stacked"
                    placeholder="Buscar..."
                    value={filterUsername}
                    onIonInput={(e) => {
                      setFilterUsername(e.detail.value ?? '');
                      setPage(1);
                    }}
                  />
                </IonCol>
                <IonCol size="12" sizeMd="3">
                  <IonInput
                    label="Correo"
                    labelPlacement="stacked"
                    placeholder="Buscar..."
                    value={filterEmail}
                    onIonInput={(e) => {
                      setFilterEmail(e.detail.value ?? '');
                      setPage(1);
                    }}
                  />
                </IonCol>
                <IonCol size="12" sizeMd="3">
                  <IonSelect
                    label="Rol"
                    labelPlacement="stacked"
                    value={filterRole}
                    onIonChange={(e) => {
                      setFilterRole(e.detail.value);
                      setPage(1);
                    }}
                  >
                    <IonSelectOption value="">Todos</IonSelectOption>
                    <IonSelectOption value="Admin">Admin</IonSelectOption>
                    <IonSelectOption value="User">User</IonSelectOption>
                  </IonSelect>
                </IonCol>
                <IonCol size="12" sizeMd="3">
                  <IonSelect
                    label="Estado"
                    labelPlacement="stacked"
                    value={filterStatus}
                    onIonChange={(e) => {
                      setFilterStatus(e.detail.value);
                      setPage(1);
                    }}
                  >
                    <IonSelectOption value="">Todos</IonSelectOption>
                    <IonSelectOption value="true">Activos</IonSelectOption>
                    <IonSelectOption value="false">Desactivados</IonSelectOption>
                  </IonSelect>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        <IonList>
          {users.map((u) => {
            const isSelf = u.id === currentUser?.id;
            return (
              <IonCard key={u.id}>
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h2 style={{ margin: 0, fontWeight: 700 }}>
                        {u.username}{' '}
                        <IonBadge color={u.role === 'Admin' ? 'warning' : 'medium'}>{u.role}</IonBadge>{' '}
                        <IonBadge color={u.isActive ? 'success' : 'danger'}>
                          {u.isActive ? 'Activo' : 'Desactivado'}
                        </IonBadge>
                        {u.hasActiveRefreshToken && (
                          <IonBadge color="tertiary" style={{ marginLeft: 6 }}>
                            Sesión Activa
                          </IonBadge>
                        )}
                      </h2>
                      <p style={{ margin: '4px 0' }}>{u.email} | Nacimiento: {u.birthDate}</p>
                      <IonText color="medium">
                        <small>Creado: {new Date(u.createdAtUtc).toLocaleString()}</small>
                      </IonText>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <IonButton size="small" onClick={() => openEdit(u)}>
                        Editar
                      </IonButton>
                      <IonButton
                        size="small"
                        color={u.isActive ? 'warning' : 'success'}
                        disabled={isSelf}
                        onClick={() => toggleActiveQuick(u)}
                      >
                        {u.isActive ? 'Desactivar' : 'Activar'}
                      </IonButton>
                      <IonButton
                        size="small"
                        color="tertiary"
                        disabled={isSelf || !u.hasActiveRefreshToken}
                        onClick={() => handleRevokeToken(u)}
                      >
                        Revocar Token
                      </IonButton>
                      <IonButton
                        size="small"
                        color="danger"
                        disabled={isSelf}
                        onClick={() => handleDelete(u)}
                      >
                        Eliminar
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            );
          })}
        </IonList>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 16 }}>
          <IonButton size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </IonButton>
          <span>
            Página {page} de {totalPages}
          </span>
          <IonButton size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </IonButton>
        </div>

        {/* Modal Crear Usuario */}
        <IonModal isOpen={showCreate} onDidDismiss={() => setShowCreate(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Crear Nuevo Usuario</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowCreate(false)}>
                Cerrar
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <form onSubmit={handleCreate}>
              <IonItem>
                <IonInput
                  label="Usuario"
                  labelPlacement="stacked"
                  value={newUsername}
                  onIonInput={(e) => setNewUsername(e.detail.value ?? '')}
                  required
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Correo"
                  labelPlacement="stacked"
                  type="email"
                  value={newEmail}
                  onIonInput={(e) => setNewEmail(e.detail.value ?? '')}
                  required
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Contraseña"
                  labelPlacement="stacked"
                  type="password"
                  value={newPassword}
                  onIonInput={(e) => setNewPassword(e.detail.value ?? '')}
                  required
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Fecha de Nacimiento"
                  labelPlacement="stacked"
                  type="date"
                  value={newBirthDate}
                  onIonInput={(e) => setNewBirthDate(e.detail.value ?? '')}
                  required
                />
              </IonItem>
              <IonItem>
                <IonSelect
                  label="Rol"
                  value={newRole}
                  onIonChange={(e) => setNewRole(e.detail.value)}
                >
                  <IonSelectOption value="User">User</IonSelectOption>
                  <IonSelectOption value="Admin">Admin</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonToggle checked={newIsActive} onIonChange={(e) => setNewIsActive(e.detail.checked)}>
                  Cuenta Activa
                </IonToggle>
              </IonItem>
              <IonButton expand="block" type="submit" style={{ marginTop: 20 }}>
                Guardar Usuario
              </IonButton>
            </form>
          </IonContent>
        </IonModal>

        {/* Modal Editar Usuario */}
        <IonModal isOpen={!!editingUser} onDidDismiss={() => setEditingUser(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Editar Usuario: {editingUser?.username}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setEditingUser(null)}>
                Cerrar
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <form onSubmit={handleUpdate}>
              <IonItem>
                <IonInput
                  label="Usuario"
                  labelPlacement="stacked"
                  value={editUsername}
                  onIonInput={(e) => setEditUsername(e.detail.value ?? '')}
                  required
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Correo"
                  labelPlacement="stacked"
                  type="email"
                  value={editEmail}
                  onIonInput={(e) => setEditEmail(e.detail.value ?? '')}
                  required
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Fecha de Nacimiento"
                  labelPlacement="stacked"
                  type="date"
                  value={editBirthDate}
                  onIonInput={(e) => setEditBirthDate(e.detail.value ?? '')}
                  required
                />
              </IonItem>
              <IonItem>
                <IonSelect
                  label="Rol"
                  value={editRole}
                  disabled={editingUser?.id === currentUser?.id}
                  onIonChange={(e) => setEditRole(e.detail.value)}
                >
                  <IonSelectOption value="User">User</IonSelectOption>
                  <IonSelectOption value="Admin">Admin</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonToggle
                  checked={editIsActive}
                  disabled={editingUser?.id === currentUser?.id}
                  onIonChange={(e) => setEditIsActive(e.detail.checked)}
                >
                  Cuenta Activa
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonInput
                  label="Nueva Contraseña (dejar vacío para no cambiar)"
                  labelPlacement="stacked"
                  type="password"
                  value={editPassword}
                  onIonInput={(e) => setEditPassword(e.detail.value ?? '')}
                />
              </IonItem>
              <IonButton expand="block" type="submit" style={{ marginTop: 20 }}>
                Actualizar Usuario
              </IonButton>
            </form>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AdminUsersPage;