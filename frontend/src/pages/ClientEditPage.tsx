import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { clientsApi } from "../api/clients";
import type { Client } from "../types";
import { ApiError } from "../api/client";

export function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;
    clientsApi
      .get(id)
      .then((data) => {
        setClient(data);
        setName(data.name);
        setContactName(data.contactName ?? "");
        setContactEmail(data.contactEmail ?? "");
        setContactPhone(data.contactPhone ?? "");
        setBillingAddress(data.billingAddress ?? "");
        setNotes(data.notes ?? "");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load client"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setError(null);
    try {
      await clientsApi.update(id, {
        name,
        contactName: contactName || undefined,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        billingAddress: billingAddress || undefined,
        notes: notes || undefined,
      });
      navigate(`/clients/${id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update client");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <p>Loading...</p>
      </Layout>
    );
  }

  if (error && !client) {
    return (
      <Layout>
        <div className="error-banner">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <p className="breadcrumb">
        <Link to="/clients">Clients</Link> / <Link to={`/clients/${id}`}>{client?.name}</Link> /
        Edit
      </p>
      <h2>Edit client</h2>

      <form className="edit-page-form" onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>
        <label>
          Contact person
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </label>
        <label>
          Contact email
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </label>
        <label>
          Contact phone
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </label>
        <label>
          Billing address
          <textarea
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            rows={2}
          />
        </label>
        <label>
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} />
        </label>
        <div className="modal-actions">
          <div className="spacer" />
          <button type="button" className="secondary" onClick={() => navigate(`/clients/${id}`)}>
            Cancel
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Layout>
  );
}
