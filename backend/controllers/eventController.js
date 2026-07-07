const Event = require("../models/Event");
const logActivity = require("../middleware/logActivity");

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

// Public (token-gated): powers the /#/manage/:token event-manager page. Anyone with the
// link can view this one event's details - there's no separate login, the link is the credential.
exports.getByManagerToken = async (req, res) => {
  const event = await Event.findOne({ managerToken: req.params.token });
  if (!event) return res.status(404).json({ message: "Invalid or expired manager link" });
  res.json({ event });
};

// ---- Admin ----

exports.adminList = async (req, res) => {
  const events = await Event.find().sort({ createdAt: -1 });
  res.json({ events });
};

exports.create = async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, createdBy: req.admin._id });
    await logActivity(req, "created_event", { eventId: event._id, title: event.title });
    res.status(201).json({ event });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Could not create event", detail: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: "Event not found" });
    await logActivity(req, "updated_event", { eventId: event._id, title: event.title });
    res.json({ event });
  } catch (err) {
    res.status(400).json({ message: "Could not update event", detail: err.message });
  }
};

// Creates (or rotates) this event's secret manager link. Rotating invalidates the old link.
exports.regenerateManagerLink = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  event.generateManagerToken();
  await event.save();
  await logActivity(req, "regenerated_manager_link", { eventId: event._id, title: event.title });
  res.json({ managerToken: event.managerToken });
};

exports.remove = async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  await logActivity(req, "deleted_event", { eventId: event._id, title: event.title });
  res.json({ message: "Event deleted" });
};
