import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { projectsApi } from "../api/projects";
import { clientsApi } from "../api/clients";
import { filesApi } from "../api/files";
import type { ProjectFile } from "../api/files";
import type { Project } from "../types";
import { ApiError } from "../api/client";
import { downloadBlob } from "../utils/downloadBlob";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectFormPage() {
  // Editing an existing project uses :id; creating a new one under a client uses :clientId.
  const { id, clientId } = useParams<{ id?: string; clientId?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [project, setProject] = useState<Project | null>(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [stagingUrl, setStagingUrl] = useState("");
  const [devUrl, setDevUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        if (isEdit && id) {
          const data = await projectsApi.get(id);
          setProject(data);
          setName(data.name);
          setDescription(data.description ?? "");
          setUrl(data.url ?? "");
          setStagingUrl(data.stagingUrl ?? "");
          setDevUrl(data.devUrl ?? "");
          setNotes(data.notes ?? "");
          setFiles(await filesApi.list(id));
        } else if (clientId) {
          const client = await clientsApi.get(clientId);
          setClientName(client.name);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, clientId, isEdit]);

  function backLink() {
    if (isEdit && id) return `/projects/${id}`;
    return `/clients/${clientId}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && id) {
        // Send null (not undefined) for emptied fields, or JSON drops them and the old value stays.
        await projectsApi.update(id, {
          name,
          description: description || null,
          url: url || null,
          stagingUrl: stagingUrl || null,
          devUrl: devUrl || null,
          notes: notes || null,
        });
        navigate(`/projects/${id}`);
      } else if (clientId) {
        const created = await clientsApi.createProject(clientId, {
          name,
          description: description || undefined,
          url: url || undefined,
          stagingUrl: stagingUrl || undefined,
          devUrl: devUrl || undefined,
          notes: notes || undefined,
        });
        navigate(`/projects/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save project");
      setSubmitting(false);
    }
  }

  async function handleFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    if (!id || !e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      await filesApi.upload(id, e.target.files);
      setFiles(await filesApi.list(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(file: ProjectFile) {
    if (!id) return;
    try {
      const blob = await filesApi.download(id, file.id);
      downloadBlob(blob, file.originalName);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to download file");
    }
  }

  async function handleDeleteFile(file: ProjectFile) {
    if (!id) return;
    if (!confirm(`Delete "${file.originalName}"?`)) return;
    await filesApi.remove(id, file.id);
    setFiles(await filesApi.list(id));
  }

  if (loading) {
    return (
      <Layout>
        <p>Loading...</p>
      </Layout>
    );
  }

  const breadcrumbClientName = isEdit ? project?.client?.name : clientName;
  const breadcrumbClientId = isEdit ? project?.client?.id : clientId;

  return (
    <Layout>
      <p className="breadcrumb">
        <Link to="/clients">Clients</Link>
        {breadcrumbClientId && (
          <>
            {" / "}
            <Link to={`/clients/${breadcrumbClientId}`}>{breadcrumbClientName}</Link>
          </>
        )}
        {isEdit && project && (
          <>
            {" / "}
            <Link to={`/projects/${project.id}`}>{project.name}</Link>
          </>
        )}
        {" / "}
        {isEdit ? "Edit" : "New project"}
      </p>
      <h2>{isEdit ? "Edit project" : "New project"}</h2>

      <form className="edit-page-form" onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </label>
        <label>
          Production / live URL
          <input type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
        </label>
        <label>
          Staging URL
          <input
            type="url"
            placeholder="https://..."
            value={stagingUrl}
            onChange={(e) => setStagingUrl(e.target.value)}
          />
        </label>
        <label>
          Dev URL
          <input
            type="url"
            placeholder="https://..."
            value={devUrl}
            onChange={(e) => setDevUrl(e.target.value)}
          />
        </label>
        <label>
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} />
        </label>
        <div className="modal-actions">
          <div className="spacer" />
          <button type="button" className="secondary" onClick={() => navigate(backLink())}>
            Cancel
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {isEdit && id && (
        <section className="members-panel">
          <h4>Files</h4>
          <p className="subtitle">
            Stored in a dedicated folder for this project, named after the client and project.
          </p>

          {files.length === 0 ? (
            <p className="empty-state">No files uploaded yet.</p>
          ) : (
            <ul className="file-list">
              {files.map((f) => (
                <li key={f.id}>
                  <span className="file-name">{f.originalName}</span>
                  <span className="file-meta">
                    {formatSize(f.size)} · {f.uploadedBy.name}
                  </span>
                  <button className="secondary" onClick={() => handleDownload(f)}>
                    Download
                  </button>
                  <button className="danger" onClick={() => handleDeleteFile(f)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="inline-form">
            <input ref={fileInputRef} type="file" multiple onChange={handleFilesSelected} disabled={uploading} />
          </div>
          {uploading && <p className="empty-state">Uploading...</p>}
        </section>
      )}
    </Layout>
  );
}
