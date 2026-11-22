import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  IonPage,
  IonRow,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { API_BASE, apiFetch, getSession, parseError } from '../services/api';

interface DirectoryItem {
  id: string;
  name: string;
  parentId: string | null;
  ownerId: string;
  ownerUsername: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

interface FileItem {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  directoryId: string;
  directoryName: string;
  ownerId: string;
  ownerUsername: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

const StoragePage: React.FC = () => {
  const session = getSession();
  const currentUser = session?.user;
  const isAdmin = currentUser?.role === 'Admin';

  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Raíz' },
  ]);
  const currentDir = breadcrumbs[breadcrumbs.length - 1];

  const [directories, setDirectories] = useState<DirectoryItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filePage, setFilePage] = useState(1);
  const [fileTotal, setFileTotal] = useState(0);
  const pageSize = 10;

  // Filters
  const [searchName, setSearchName] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [newDirName, setNewDirName] = useState('');

  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadContent = useCallback(async () => {
    setErrorMsg('');

    // 1. Cargar directorios hijos de currentDir.id
    const dirParams = new URLSearchParams({ page: '1', pageSize: '100' });
    if (currentDir.id) dirParams.set('parentId', currentDir.id);
    if (searchName.trim()) dirParams.set('search', searchName.trim());

    const dirRes = await apiFetch(`/storage/directories?${dirParams.toString()}`);
    if (dirRes.ok) {
      const dirData = await dirRes.json();
      setDirectories(dirData.items || []);
    }

    // 2. Cargar archivos del directorio actual (o búsqueda global si hay filtro)
    const fileParams = new URLSearchParams({
      page: String(filePage),
      pageSize: String(pageSize),
    });
    if (currentDir.id) fileParams.set('directoryId', currentDir.id);
    if (searchName.trim()) fileParams.set('name', searchName.trim());
    if (filterOwner.trim()) fileParams.set('owner', filterOwner.trim());

    const fileRes = await apiFetch(`/storage/files?${fileParams.toString()}`);
    if (fileRes.ok) {
      const fileData = await fileRes.json();
      setFiles(fileData.items || []);
      setFileTotal(fileData.total || 0);
    }
  }, [currentDir.id, filePage, searchName, filterOwner]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleCreateDir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirName.trim()) return;
    setErrorMsg('');
    setFeedback('');

    const res = await apiFetch('/storage/directories', {
      method: 'POST',
      body: JSON.stringify({
        name: newDirName.trim(),
        parentId: currentDir.id,
      }),
    });

    if (!res.ok) {
      setErrorMsg(await parseError(res));
      return;
    }

    setNewDirName('');
    setFeedback('Directorio creado.');
    loadContent();
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentDir.id) {
      setErrorMsg('Entra a un directorio antes de subir un archivo.');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('El archivo supera el límite máximo de 10 MB.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setFeedback('');

    try {
      const form = new FormData();
      form.append('directoryId', currentDir.id);
      form.append('file', file);

      const res = await apiFetch('/storage/files/upload', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        setErrorMsg(await parseError(res));
        return;
      }

      setFeedback(`Archivo "${file.name}" subido correctamente.`);
      loadContent();
    } catch {
      setErrorMsg('Error al subir el archivo.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (f: FileItem) => {
    setErrorMsg('');
    const res = await apiFetch(`/storage/files/${f.id}/download`);
    if (!res.ok) {
      setErrorMsg(await parseError(res));
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.originalName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleRenameDir = async (d: DirectoryItem) => {
    const next = window.prompt('Nuevo nombre del directorio:', d.name);
    if (!next || next.trim() === d.name) return;
    setErrorMsg('');
    const res = await apiFetch(`/storage/directories/${d.id}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ newName: next.trim() }),
    });
    if (!res.ok) {
      setErrorMsg(await parseError(res));
      return;
    }
    setFeedback('Directorio renombrado.');
    loadContent();
  };

  const handleDeleteDir = async (d: DirectoryItem) => {
    if (!window.confirm(`¿Eliminar el directorio "${d.name}"? (Debe estar vacío)`)) return;
    setErrorMsg('');
    const res = await apiFetch(`/storage/directories/${d.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setErrorMsg(await parseError(res));
      return;
    }
    setFeedback('Directorio eliminado.');
    loadContent();
  };

  const handleRenameFile = async (f: FileItem) => {
    const next = window.prompt('Nuevo nombre del archivo (se conservará su extensión):', f.originalName);
    if (!next || next.trim() === f.originalName) return;
    setErrorMsg('');
    const res = await apiFetch(`/storage/files/${f.id}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ newName: next.trim() }),
    });
    if (!res.ok) {
      setErrorMsg(await parseError(res));
      return;
    }
    setFeedback('Archivo renombrado.');
    loadContent();
  };

  const handleDeleteFile = async (f: FileItem) => {
    if (!window.confirm(`¿Eliminar el archivo "${f.originalName}"?`)) return;
    setErrorMsg('');
    const res = await apiFetch(`/storage/files/${f.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setErrorMsg(await parseError(res));
      return;
    }
    setFeedback('Archivo eliminado.');
    loadContent();
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalPages = Math.max(1, Math.ceil(fileTotal / pageSize));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Gestor de Directorios y Archivos</IonTitle>
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

        {/* Ruta / Breadcrumbs */}
        <IonCard>
          <IonCardContent>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <strong>Ubicación:</strong>
              {breadcrumbs.map((b, idx) => (
                <React.Fragment key={b.id ?? 'root'}>
                  {idx > 0 && <span>/</span>}
                  <IonButton
                    size="small"
                    fill={idx === breadcrumbs.length - 1 ? 'solid' : 'clear'}
                    onClick={() => {
                      setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
                      setFilePage(1);
                    }}
                  >
                    {b.name}
                  </IonButton>
                </React.Fragment>
              ))}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Acciones: Crear carpeta + Subir archivo + Filtros */}
        <IonCard>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <form onSubmit={handleCreateDir} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <IonItem style={{ flex: 1 }}>
                      <IonInput
                        label="Nuevo Directorio aquí"
                        labelPlacement="stacked"
                        placeholder="Ej. Documentos"
                        value={newDirName}
                        onIonInput={(e) => setNewDirName(e.detail.value ?? '')}
                      />
                    </IonItem>
                    <IonButton type="submit">Crear Carpeta</IonButton>
                  </form>
                </IonCol>

                <IonCol size="12" sizeMd="6" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleUploadFile}
                  />
                  <IonButton
                    color="secondary"
                    disabled={!currentDir.id || uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? 'Subiendo...' : 'Subir Archivo (Máx. 10 MB)'}
                  </IonButton>
                  {!currentDir.id && (
                    <IonText color="medium">
                      <small>Abre o crea un directorio para subir archivos</small>
                    </IonText>
                  )}
                </IonCol>
              </IonRow>

              <IonRow style={{ marginTop: 8 }}>
                <IonCol size="12" sizeMd="6">
                  <IonInput
                    label="Filtrar por nombre"
                    labelPlacement="stacked"
                    placeholder="Buscar carpeta o archivo..."
                    value={searchName}
                    onIonInput={(e) => {
                      setSearchName(e.detail.value ?? '');
                      setFilePage(1);
                    }}
                  />
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonInput
                    label="Filtrar por propietario"
                    labelPlacement="stacked"
                    placeholder="Usuario dueño..."
                    value={filterOwner}
                    onIonInput={(e) => {
                      setFilterOwner(e.detail.value ?? '');
                      setFilePage(1);
                    }}
                  />
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Directorios */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Directorios ({directories.length})</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {directories.length === 0 ? (
              <IonText color="medium">No hay subdirectorios en esta ubicación.</IonText>
            ) : (
              <IonList>
                {directories.map((d) => {
                  const canManage = isAdmin || d.ownerId === currentUser?.id;
                  return (
                    <IonItem key={d.id}>
                      <div style={{ flex: 1, padding: '8px 0' }}>
                        <strong>📁 {d.name}</strong>
                        <div>
                          <small>
                            Propietario: {d.ownerUsername} | Creado: {new Date(d.createdAtUtc).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      <IonButton
                        size="small"
                        onClick={() => {
                          setBreadcrumbs([...breadcrumbs, { id: d.id, name: d.name }]);
                          setFilePage(1);
                        }}
                      >
                        Abrir
                      </IonButton>
                      {canManage && (
                        <>
                          <IonButton size="small" fill="outline" onClick={() => handleRenameDir(d)}>
                            Renombrar
                          </IonButton>
                          <IonButton size="small" color="danger" fill="outline" onClick={() => handleDeleteDir(d)}>
                            Eliminar
                          </IonButton>
                        </>
                      )}
                    </IonItem>
                  );
                })}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        {/* Archivos */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Archivos en "{currentDir.name}" ({fileTotal})</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {!currentDir.id && !searchName && !filterOwner ? (
              <IonText color="medium">Selecciona un directorio arriba para ver o subir sus archivos.</IonText>
            ) : files.length === 0 ? (
              <IonText color="medium">No se encontraron archivos.</IonText>
            ) : (
              <IonList>
                {files.map((f) => {
                  const canManage = isAdmin || f.ownerId === currentUser?.id;
                  return (
                    <IonItem key={f.id}>
                      <div style={{ flex: 1, padding: '8px 0' }}>
                        <strong>📄 {f.originalName}</strong>{' '}
                        <IonBadge color="medium">{formatBytes(f.sizeBytes)}</IonBadge>
                        <div>
                          <small>
                            Carpeta: {f.directoryName} | Dueño: {f.ownerUsername} |{' '}
                            {new Date(f.createdAtUtc).toLocaleString()}
                          </small>
                        </div>
                      </div>
                      <IonButton size="small" color="success" onClick={() => handleDownload(f)}>
                        Descargar
                      </IonButton>
                      {canManage && (
                        <>
                          <IonButton size="small" fill="outline" onClick={() => handleRenameFile(f)}>
                            Renombrar
                          </IonButton>
                          <IonButton size="small" color="danger" fill="outline" onClick={() => handleDeleteFile(f)}>
                            Eliminar
                          </IonButton>
                        </>
                      )}
                    </IonItem>
                  );
                })}
              </IonList>
            )}

            {fileTotal > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                <IonButton size="small" disabled={filePage <= 1} onClick={() => setFilePage((p) => p - 1)}>
                  Anterior
                </IonButton>
                <span>
                  Página {filePage} de {totalPages}
                </span>
                <IonButton size="small" disabled={filePage >= totalPages} onClick={() => setFilePage((p) => p + 1)}>
                  Siguiente
                </IonButton>
              </div>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default StoragePage;