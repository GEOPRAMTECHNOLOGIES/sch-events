import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { adminApi } from "../../api/client";
import { useAdminAuth } from "../../context/AdminAuthContext";

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  category: "General",
  venue: "",
  campus: "",
  startsAt: "",
  endsAt: "",
  coverImageUrl: "",
  gallery: [],
  externalLink: "",
  themeColor: "",
  isPublished: true,
  tiers: [{ name: "Regular", price: 0, quantityTotal: 100 }],
};

export default function Events() {
  const { admin } = useAdminAuth();
  const isManager = admin?.role === "manager";
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

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
      slug: ev.slug || "",
      description: ev.description,
      category: ev.category,
      venue: ev.venue,
      campus: ev.campus,
      startsAt: dayjs(ev.startsAt).format("YYYY-MM-DDTHH:mm"),
      endsAt: ev.endsAt ? dayjs(ev.endsAt).format("YYYY-MM-DDTHH:mm") : "",
      coverImageUrl: ev.coverImageUrl || "",
      gallery: (ev.gallery || []).map((g) => ({ url: g.url, caption: g.caption || "" })),
      externalLink: ev.externalLink || "",
      themeColor: ev.themeColor || "",
      isPublished: ev.isPublished,
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

  // Responsive image gallery - admins can attach more than one image per event.
  function updateGalleryImage(idx, field, value) {
    setForm((f) => {
      const gallery = [...f.gallery];
      gallery[idx] = { ...gallery[idx], [field]: value };
      return { ...f, gallery };
    });
  }
  function addGalleryImage() {
    setForm((f) => ({ ...f, gallery: [...f.gallery, { url: "", caption: "" }] }));
  }
  function removeGalleryImage(idx) {
    setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, gallery: form.gallery.filter((g) => g.url.trim()) };
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

  async function handleDismissReminder(id) {
    await adminApi.post(`/events/admin/${id}/dismiss-reminder`);
    load();
  }

  function shareLink(ev) {
    return `${window.location.origin}${window.location.pathname}#/event/${ev.slug}`;
  }
  function copyLink(ev) {
    navigator.clipboard.writeText(shareLink(ev));
    setCopiedId(ev._id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>{isManager ? "My event" : "Events"}</h1>
        {!isManager && <button className="btn btn-gold" onClick={startCreate}>+ New event</button>}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label>Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field">
              <label>Shareable link slug</label>
              <input
                placeholder="auto-generated from title if left blank"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
              <p className="help-text">e.g. #/event/{form.slug || "freshers-night"}</p>
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
              <label>Ends at</label>
              <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              <p className="help-text">Used for the "delete old events" reminder a month after the event ends.</p>
            </div>
            <div className="field">
              <label>Published</label>
              <select value={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.value === "true" })}>
                <option value="true">Yes</option>
                <option value="false">No (draft)</option>
              </select>
            </div>
            <div className="field">
              <label>Cover image URL</label>
              <input placeholder="https://..." value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} />
            </div>
            <div className="field">
              <label>External link (optional)</label>
              <input
                placeholder="https://... sponsor page, livestream, group chat, etc."
                value={form.externalLink}
                onChange={(e) => setForm({ ...form, externalLink: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Event color theme (optional)</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" style={{ width: 48, padding: 2 }} value={form.themeColor || "#0b4f2c"} onChange={(e) => setForm({ ...form, themeColor: e.target.value })} />
                <input placeholder="#0B4F2C" value={form.themeColor} onChange={(e) => setForm({ ...form, themeColor: e.target.value })} />
              </div>
              <p className="help-text">Leave blank to use the site's default theme.</p>
            </div>
          </div>

          <div className="field">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <label>Gallery images (responsive, more than one allowed)</label>
          {form.gallery.map((g, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8, marginBottom: 8 }}>
              <input placeholder="Image URL" value={g.url} onChange={(e) => updateGalleryImage(i, "url", e.target.value)} />
              <input placeholder="Caption (optional)" value={g.caption} onChange={(e) => updateGalleryImage(i, "caption", e.target.value)} />
              <button type="button" className="btn btn-ghost" onClick={() => removeGalleryImage(i)}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={addGalleryImage} style={{ marginBottom: 16 }}>+ Add gallery image</button>

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

      <div className="card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "var(--paper-dim)" }}>
              {["Title", "Venue", "Starts", "Tickets sold", "Revenue", "Published", "Shareable link", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev._id} style={{ borderTop: "1px solid var(--stub-line)" }}>
                <td style={{ padding: "10px 14px" }}>
                  {ev.title}
                  {ev.needsCleanupReminder && (
                    <div style={{ marginTop: 4 }}>
                      <span className="pill pill-danger">Over a month old &mdash; consider deleting</span>{" "}
                      {!isManager && (
                        <button className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => handleDismissReminder(ev._id)}>
                          Keep it
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td style={{ padding: "10px 14px" }}>{ev.venue}</td>
                <td style={{ padding: "10px 14px" }}>{dayjs(ev.startsAt).format("D MMM YYYY HH:mm")}</td>
                <td style={{ padding: "10px 14px" }}>{ev.ticketsSold}</td>
                <td style={{ padding: "10px 14px" }}>KSh {ev.revenue?.toLocaleString()}</td>
                <td style={{ padding: "10px 14px" }}>{ev.isPublished ? "Yes" : "Draft"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => copyLink(ev)}>
                    {copiedId === ev._id ? "Copied!" : "Copy link"}
                  </button>
                </td>
                <td style={{ padding: "10px 14px", display: "flex", gap: 6 }}>
                  {!isManager && (
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
