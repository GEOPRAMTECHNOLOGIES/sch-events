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

exports.remove = async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  await logActivity(req, "deleted_event", { eventId: event._id, title: event.title });
  res.json({ message: "Event deleted" });
};
