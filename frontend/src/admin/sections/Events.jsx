import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { adminApi } from "../../api/client";

const emptyForm = {
  title: "",
  description: "",
  category: "General",
  venue: "",
  campus: "",
  startsAt: "",
  isPublished: true,
  tiers: [{ name: "Regular", price: 0, quantityTotal: 100 }],
  images: [],
  externalLink: "",
  themeColor: "",
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [managerLinks, setManagerLinks] = useState({}); // eventId -> full link, shown after generating

  function load() {
    adminApi.get("/events/admin/all").then((res) => setEvents(res.data.events));
  }
  useEffect(load, []);

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(ev) {
    setForm({
      title: ev.title,
      description: ev.description,
      category: ev.category,
      venue: ev.venue,
      campus: ev.campus,
      startsAt: dayjs(ev.startsAt).format("YYYY-MM-DDTHH:mm"),
      isPublished: ev.isPublished,
      tiers: ev.tiers.map((t) => ({ name: t.name, price: t.price, quantityTotal: t.quantityTotal })),
      images: ev.images || [],
      externalLink: ev.externalLink || "",
      themeColor: ev.themeColor || "",
    });
    setEditingId(ev._id);
    setShowForm(true);
  }

  function updateTier(idx, field, value) {
    setForm((f) => {
      const tiers = [...f.tiers];
      tiers[idx] = { ...tiers[idx], [field]: value };
      return { ...f, tiers };
    });
  }

  function addTier() {
    setForm((f) => ({ ...f, tiers: [...f.tiers, { name: "", price: 0, quantityTotal: 50 }] }));
  }

  function removeTier(idx) {
    setForm((f) => ({ ...f, tiers: f.tiers.filter((_, i) => i !== idx) }));
  }

  function updateImage(idx, value) {
    setForm((f) => {
      const images = [...f.images];
      images[idx] = value;
      return { ...f, images };
    });
  }

  function addImage() {
    setForm((f) => ({ ...f, images: [...f.images, ""] }));
  }

  function removeImage(idx) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  async function handleGetManagerLink(eventId) {
    const res = await adminApi.post(`/events/admin/${eventId}/manager-link`);
    const link = `${window.location.origin}/#/manage/${res.data.managerToken}`;
    setManagerLinks((m) => ({ ...m, [eventId]: link }));
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // clipboard access can fail (e.g. non-HTTPS); the link is still shown on screen either way
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await adminApi.put(`/events/admin/${editingId}`, form);
      } else {
        await adminApi.post("/events/admin", form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save event");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    await adminApi.delete(`/events/admin/${id}`);
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>Events</h1>
        <button className="btn btn-gold" onClick={startCreate}>+ New event</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label>Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field">
              <label>Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="field">
              <label>Venue</label>
              <input required value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            </div>
            <div className="field">
              <label>Campus</label>
              <input value={form.campus} onChange={(e) => setForm({ ...form, campus: e.target.value })} />
            </div>
            <div className="field">
              <label>Starts at</label>
              <input type="datetime-local" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            </div>
            <div className="field">
              <label>Published</label>
              <select value={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.value === "true" })}>
                <option value="true">Yes</option>
                <option value="false">No (draft)</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label>External link (optional)</label>
              <input placeholder="https://..." value={form.externalLink} onChange={(e) => setForm({ ...form, externalLink: e.target.value })} />
            </div>
            <div className="field">
              <label>Event accent color (optional)</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  style={{ width: 44, padding: 2 }}
                  value={form.themeColor || "#1b2a4a"}
                  onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                />
                <button type="button" className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setForm({ ...form, themeColor: "" })}>
                  Use site default
                </button>
              </div>
            </div>
          </div>

          <label>Gallery images (URLs)</label>
          {form.images.map((src, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 8 }}>
              <input placeholder="https://example.com/photo.jpg" value={src} onChange={(e) => updateImage(i, e.target.value)} />
              <button type="button" className="btn btn-ghost" onClick={() => removeImage(i)}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={addImage} style={{ marginBottom: 16 }}>+ Add image URL</button>

          <label>Ticket tiers</label>
          {form.tiers.map((t, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, marginBottom: 8 }}>
              <input placeholder="Tier name" required value={t.name} onChange={(e) => updateTier(i, "name", e.target.value)} />
              <input type="number" min="0" placeholder="Price (KSh)" required value={t.price} onChange={(e) => updateTier(i, "price", Number(e.target.value))} />
              <input type="number" min="1" placeholder="Quantity" required value={t.quantityTotal} onChange={(e) => updateTier(i, "quantityTotal", Number(e.target.value))} />
              <button type="button" className="btn btn-ghost" onClick={() => removeTier(i)}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={addTier} style={{ marginBottom: 16 }}>+ Add tier</button>

          {error && <p className="error-text">{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-gold">{editingId ? "Save changes" : "Create event"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {events.some((ev) => ev.isStale) && (
        <div className="card" style={{ padding: "14px 18px", marginBottom: 16, borderLeft: "4px solid var(--stamp)" }}>
          <strong style={{ fontSize: 13 }}>Clean-up reminder:</strong>{" "}
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            {events.filter((ev) => ev.isStale).map((ev) => ev.title).join(", ")} ended over a month ago. Delete them below if you no longer need the data, or leave them &mdash; nothing is removed automatically.
          </span>
        </div>
      )}

      <div className="card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--paper-dim)" }}>
              {["Title", "Venue", "Starts", "Tickets sold", "Revenue", "Published", "Manager link", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev._id} style={{ borderTop: "1px solid var(--stub-line)" }}>
                <td style={{ padding: "10px 14px" }}>
                  {ev.title} {ev.isStale && <span className="pill pill-danger" style={{ marginLeft: 6 }}>stale</span>}
                </td>
                <td style={{ padding: "10px 14px" }}>{ev.venue}</td>
                <td style={{ padding: "10px 14px" }}>{dayjs(ev.startsAt).format("D MMM YYYY HH:mm")}</td>
                <td style={{ padding: "10px 14px" }}>{ev.ticketsSold}</td>
                <td style={{ padding: "10px 14px" }}>KSh {ev.revenue?.toLocaleString()}</td>
                <td style={{ padding: "10px 14px" }}>{ev.isPublished ? "Yes" : "Draft"}</td>
                <td style={{ padding: "10px 14px", maxWidth: 220 }}>
                  {managerLinks[ev._id] ? (
                    <span className="mono" style={{ fontSize: 11, wordBreak: "break-all" }}>{managerLinks[ev._id]}</span>
                  ) : (
                    <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleGetManagerLink(ev._id)}>
                      Get link
                    </button>
                  )}
                </td>
                <td style={{ padding: "10px 14px", display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => startEdit(ev)}>Edit</button>
                  <button className="btn btn-danger" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleDelete(ev._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
