const Event = require("../models/Event");
const logActivity = require("../middleware/logActivity");
const { slugify } = require("../utils/helpers");

async function uniqueSlug(baseTitle, excludeId) {
  const base = slugify(baseTitle);
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await Event.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!clash) return slug;
    slug = `${base}-${i++}`;
  }
}

function isValidHttpUrl(value) {
  if (!value) return true; // optional field
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

exports.listPublic = async (req, res) => {
  const { category, campus, search } = req.query;
  const filter = { isPublished: true, startsAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } };
  if (category) filter.category = category;
  if (campus) filter.campus = campus;
  if (search) filter.title = { $regex: search, $options: "i" };

  const events = await Event.find(filter).sort({ startsAt: 1 });
  res.json({ events });
};

exports.getOne = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json({ event });
};

// Public event page reachable via the shareable link, e.g. /#/event/freshers-night
exports.getBySlug = async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug });
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json({ event });
};

// ---- Admin ----

exports.adminList = async (req, res) => {
  // Managers only ever see the single event they're linked to.
  if (req.admin.role === "manager") {
    const filter = req.admin.linkedEvent ? { _id: req.admin.linkedEvent } : { _id: null };
    const events = await Event.find(filter);
    return res.json({ events });
  }
  const events = await Event.find().sort({ createdAt: -1 });
  res.json({ events });
};

exports.create = async (req, res) => {
  try {
    const { gallery, externalLink } = req.body;
    if (externalLink && !isValidHttpUrl(externalLink)) {
      return res.status(400).json({ message: "Event link must be a valid http(s) URL" });
    }
    if (gallery && Array.isArray(gallery)) {
      for (const g of gallery) {
        if (!isValidHttpUrl(g.url)) {
          return res.status(400).json({ message: "Every gallery image needs a valid image URL" });
        }
      }
    }
    const slug = req.body.slug ? slugify(req.body.slug) : await uniqueSlug(req.body.title);
    const event = await Event.create({ ...req.body, slug, createdBy: req.admin._id });
    await logActivity(req, "created_event", { eventId: event._id, title: event.title });
    res.status(201).json({ event });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) return res.status(409).json({ message: "That event link/slug is already taken" });
    res.status(400).json({ message: "Could not create event", detail: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { gallery, externalLink } = req.body;
    if (externalLink && !isValidHttpUrl(externalLink)) {
      return res.status(400).json({ message: "Event link must be a valid http(s) URL" });
    }
    if (gallery && Array.isArray(gallery)) {
      for (const g of gallery) {
        if (!isValidHttpUrl(g.url)) {
          return res.status(400).json({ message: "Every gallery image needs a valid image URL" });
        }
      }
    }
    const body = { ...req.body };
    if (body.title) {
      body.slug = body.slug ? slugify(body.slug) : await uniqueSlug(body.title, req.params.id);
    }
    const event = await Event.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!event) return res.status(404).json({ message: "Event not found" });
    await logActivity(req, "updated_event", { eventId: event._id, title: event.title });
    res.json({ event });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "That event link/slug is already taken" });
    res.status(400).json({ message: "Could not update event", detail: err.message });
  }
};

exports.remove = async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  await logActivity(req, "deleted_event", { eventId: event._id, title: event.title });
  res.json({ message: "Event deleted" });
};

// Admin dismisses the "this event is over a month old, consider deleting it" nudge
// without deleting the event itself.
exports.dismissReminder = async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, { reminderDismissed: true }, { new: true });
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json({ event });
};
