const mongoose = require("mongoose");
const Event = require("../models/Event");
const logActivity = require("../middleware/logActivity");

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

async function makeUniqueSlug(title, ignoreId) {
  const base = Event.slugify(title) || "event";
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await Event.findOne({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) });
    if (!clash) return slug;
    n += 1;
    slug = `${base}-${n}`;
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

// Looks an event up by its Mongo _id OR its shareable slug, e.g. /#/event/freshers-night
exports.getOne = async (req, res) => {
  const { id } = req.params;
  const event = mongoose.isValidObjectId(id)
    ? await Event.findById(id)
    : await Event.findOne({ slug: id.toLowerCase() });
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json({ event });
};

// ---- Admin ----

// Managers only ever see the single event assigned to them by an admin.
exports.adminList = async (req, res) => {
  const filter = req.admin.role === "manager" ? { _id: req.admin.managedEvent } : {};
  const events = await Event.find(filter).populate("manager", "name email").sort({ createdAt: -1 });
  res.json({ events });
};

exports.create = async (req, res) => {
  try {
    const slug = await makeUniqueSlug(req.body.title);
    const images = Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : [];
    const event = await Event.create({
      ...req.body,
      slug,
      images,
      coverImageUrl: req.body.coverImageUrl || images[0] || "",
      createdBy: req.admin._id,
    });
    await logActivity(req, "created_event", { eventId: event._id, title: event.title });
    res.status(201).json({ event });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Could not create event", detail: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const existing = await Event.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Event not found" });

    const body = { ...req.body };
    if (body.title && body.title !== existing.title) {
      body.slug = await makeUniqueSlug(body.title, existing._id);
    }
    if (Array.isArray(body.images)) {
      body.images = body.images.filter(Boolean);
      body.coverImageUrl = body.coverImageUrl || body.images[0] || existing.coverImageUrl;
    }

    const event = await Event.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    await logActivity(req, "updated_event", { eventId: event._id, title: event.title });
    res.json({ event });
  } catch (err) {
    res.status(400).json({ message: "Could not update event", detail: err.message });
  }
};

exports.remove = async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  await logActivity(req, "deleted_event", { eventId: event._id, title: event.title });
  res.json({ message: "Event deleted" });
};

// Events whose end (or start, if no end date) was more than a month ago and
// still exist in the system - the admin gets reminded to clean them up.
exports.staleEvents = async (req, res) => {
  const cutoff = new Date(Date.now() - ONE_MONTH_MS);
  const events = await Event.find({
    $expr: { $lt: [{ $ifNull: ["$endsAt", "$startsAt"] }, cutoff] },
  })
    .select("title slug startsAt endsAt")
    .sort({ startsAt: 1 });
  res.json({ events });
};
