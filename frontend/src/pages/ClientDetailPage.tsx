import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { clientsApi } from "../api/clients";
import { useAuth } from "../context/AuthContext";
import type { Client } from "../types";
import { ApiError } from "../api/client";

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    clientsApi
      .get(id)
      .then(setClient)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load client"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDeleteClient() {
    if (!client) return;
    if (!confirm("Delete this client and all its projects and tasks? This cannot be undone.")) {
      return;
    }
    await clientsApi.remove(client.id);
    navigate("/clients");
  }

  if (loading) {
    return (
      <Layout>
        <p>Loading...</p>
      </Layout>
    );
  }

  if (error || !client) {
    return (
      <Layout>
        <div className="error-banner">{error ?? "Client not found"}</div>
      </Layout>
    );
  }

  const isCreator = client.creatorId === user?.id;
  const hasContactInfo =
    client.contactName ||
    client.contactEmail ||
    client.contactPhone ||
    client.billingAddress ||
    client.notes;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/clients">Clients</Link> / {client.name}
          </p>
          <h2>{client.name}</h2>
        </div>
        {isCreator && (
          <button className="danger" onClick={handleDeleteClient}>
            Delete client
          </button>
        )}
      </div>

      <section className="members-panel">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <h4>Client details</h4>
          <button type="button" onClick={() => navigate(`/clients/${client.id}/edit`)}>
            Edit client
          </button>
        </div>

        {hasContactInfo ? (
          <ul className="member-list">
            {client.contactName && <li>Contact: {client.contactName}</li>}
            {client.contactEmail && <li>Email: {client.contactEmail}</li>}
            {client.contactPhone && <li>Phone: {client.contactPhone}</li>}
            {client.billingAddress && <li>Address: {client.billingAddress}</li>}
            {client.notes && <li>Notes: {client.notes}</li>}
          </ul>
        ) : (
          <p className="empty-state">No contact info yet.</p>
        )}
      </section>

      <div className="page-header">
        <h3>Projects</h3>
        <button type="button" onClick={() => navigate(`/clients/${client.id}/projects/new`)}>
          New project
        </button>
      </div>

      {client.projects.length === 0 ? (
        <p className="empty-state">No projects yet for this client.</p>
      ) : (
        <div className="card-grid">
          {client.projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
              <h3>{p.name}</h3>
              {p.description && <p>{p.description}</p>}
              <p className="meta">{p.members.length} member(s)</p>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
