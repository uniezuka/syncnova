import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { clientsApi } from "../api/clients";
import type { Client } from "../types";
import { ApiError } from "../api/client";

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");

  async function loadClients() {
    setLoading(true);
    try {
      setClients(await clientsApi.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await clientsApi.create({ name });
      setName("");
      setShowForm(false);
      await loadClients();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create client");
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h2>Your clients</h2>
        <button className={showForm ? "secondary" : undefined} onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New client"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <form className="inline-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Client or company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <button type="submit">Create</button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : clients.length === 0 ? (
        <p className="empty-state">No clients yet. Create your first one above.</p>
      ) : (
        <div className="card-grid">
          {clients.map((c) => (
            <Link key={c.id} to={`/clients/${c.id}`} className="project-card">
              <h3>{c.name}</h3>
              <p className="meta">{c.projects.length} project(s)</p>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
