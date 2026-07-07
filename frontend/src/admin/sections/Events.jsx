import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { adminApi } from "../../api/client";
import { useAdminAuth } from "../../context/AdminAuthContext";

const emptyForm = {
  title: "",
  description: "",
  category: "General",
  venue: "",
  campus: "",
  startsAt: "",
  endsAt: "",
  isPublished: true,
  images: "",
  externalLink: "",
  themeColor: "",
  tiers: [{ name: "Regular", price: 0, quantityTotal: 100 }],
};

export default function Events() {
  const { admin } = useAdminAuth();
  const [events, setEvents] = useState([]);
  const [managers, setManagers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [stale, setStale] = useState([]);

  function load() {
    adminApi.get("/events/admin/all").then((res) => setEvents(res.data.events));
    adminApi.get("/events/admin/stale").then((res) => setStale(res.data.events)).catch(() => {});
    if (admin?.role === "superadmin") {
      adminApi.get("/admin-auth/admins").then((res) => setManagers(res.data.admins.filter((a) => a.role === "manager")));
    }
  }
  useEffect(load, [admin]);

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
      endsAt: ev.endsAt ? dayjs(ev.endsAt).format("YYYY-MM-DDTHH:mm") : "",
      isPublished: ev.isPublished,
      images: (ev.images || []).join("\n"),
      externalLink: ev.externalLink || "",
      themeColor: ev.themeColor || "",
      tiers: ev.tiers.map((t) => ({ name: t.name, price: t.price, quantityTotal: t.quantityTotal })),
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        images: form.images
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (editingId) {
        await adminApi.put(`/events/admin/${editingId}`, payload);
      } else {
        await adminApi.post("/events/admin", payload);
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

  async function assignManager(eventId, managerId) {
    if (!managerId) return;
    await adminApi.patch(`/admin-auth/admins/${managerId}/managed-event`, { managedEventId: eventId });
    load();
  }

  function shareUrl(ev) {
    return `${window.location.origin}/#/event/${ev.slug || ev._id}`;
  }

  function copyLink(ev) {
    navigator.clipboard?.writeText(shareUrl(ev));
    setCopiedId(ev._id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>Events</h1>
        {admin?.role !== "manager" && (
          <button className="btn btn-brand" onClick={startCreate}>+ New event</button>
        )}
      </div>

      {stale.length > 0 && admin?.role !== "manager" && (
        <div className="card" style={{ padding: 16, marginBottom: 18, borderLeft: "4px solid var(--stamp)" }}>
          <strong style={{ color: "var(--stamp)" }}>Reminder:</strong> {stale.length} event(s) ended over a month ago
          and are still in the system &mdash; consider deleting them if you no longer need their data.
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, color: "var(--ink-soft)" }}>
            {stale.map((s) => (
              <li key={s._id}>{s.title} &mdash; ended {dayjs(s.endsAt || s.startsAt).format("D MMM YYYY")}</li>
            ))}
          </ul>
        </div>
      )}

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
              <label>Ends at (optional)</label>
              <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
            </div>
            <div className="field">
              <label>Published</label>
              <select value={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.value === "true" })}>
                <option value="true">Yes</option>
                <option value="false">No (draft)</option>
              </select>
            </div>
            <div className="field">
              <label>Theme color (optional)</label>
              <input
                type="color"
                value={form.themeColor || "#0b6e4f"}
                onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                style={{ padding: 4, height: 42 }}
              />
            </div>
          </div>

          <div className="field">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="field">
            <label>Image URLs (one per line &mdash; first one is the cover, rest form a gallery)</label>
            <textarea
              rows={3}
              placeholder={"https://example.com/poster.jpg\nhttps://example.com/venue-photo.jpg"}
              value={form.images}
              onChange={(e) => setForm({ ...form, images: e.target.value })}
            />
            <p className="help-text">Use image URLs that are already sized for the web; they'll display responsively.</p>
          </div>

          <div className="field">
            <label>External link (optional &mdash; poster, map, RSVP form, etc.)</label>
            <input
              placeholder="https://..."
              value={form.externalLink}
              onChange={(e) => setForm({ ...form, externalLink: e.target.value })}
            />
          </div>

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
            <button className="btn btn-brand">{editingId ? "Save changes" : "Create event"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card table-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--paper-dim)" }}>
              {["Title", "Venue", "Starts", "Tickets sold", "Revenue", "Published", "Link", "Manager", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev._id} style={{ borderTop: "1px solid var(--stub-line)" }}>
                <td style={{ padding: "10px 14px" }}>{ev.title}</td>
                <td style={{ padding: "10px 14px" }}>{ev.venue}</td>
                <td style={{ padding: "10px 14px" }}>{dayjs(ev.startsAt).format("D MMM YYYY HH:mm")}</td>
                <td style={{ padding: "10px 14px" }}>{ev.ticketsSold}</td>
                <td style={{ padding: "10px 14px" }}>KSh {ev.revenue?.toLocaleString()}</td>
                <td style={{ padding: "10px 14px" }}>{ev.isPublished ? "Yes" : "Draft"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <button className="btn btn-ghost mono" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => copyLink(ev)}>
                    {copiedId === ev._id ? "Copied!" : "Copy link"}
                  </button>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {admin?.role === "superadmin" ? (
                    <select
                      defaultValue=""
                      style={{ fontSize: 12, padding: "6px 8px" }}
                      onChange={(e) => assignManager(ev._id, e.target.value)}
                    >
                      <option value="">{ev.manager?.name || "Unassigned"}</option>
                      {managers.map((m) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  ) : (
                    ev.manager?.name || "\u2014"
                  )}
                </td>
                <td style={{ padding: "10px 14px", display: "flex", gap: 6 }}>
                  {admin?.role !== "manager" && (
                    <>
                      <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => startEdit(ev)}>Edit</button>
                      <button className="btn btn-danger" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleDelete(ev._id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
