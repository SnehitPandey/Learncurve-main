require('dotenv').config();
const mongoose = require('mongoose');

async function debug() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const Room = mongoose.model('Room', new mongoose.Schema({}, { strict: false }));
  
  // Get the most recently created room
  const room = await Room.findOne().sort({ createdAt: -1 }).lean();
  
  if (!room) {
    console.log("No rooms found");
    process.exit(0);
  }

  console.log("=== LATEST ROOM ===");
  console.log("Title:", room.title);
  console.log("Status:", room.status);
  console.log("\n=== FIRST TOPIC IN ROADMAP ===");
  try {
    const topic = room.roadmap.phases[0].milestones[0].topics[0];
    console.log("Type of topic:", typeof topic);
    console.log("topic:", topic);
    console.log("Type of topic.title:", typeof topic.title);
    console.log("topic.title:", topic.title);
  } catch (e) {
    console.log("Could not find topic", e.message);
  }

  console.log("\n=== KANBAN BOARD TASKS ===");
  if (room.kanbanBoards && room.kanbanBoards.length > 0) {
    const tasks = room.kanbanBoards[0].tasks;
    console.log(`Found ${tasks.length} tasks in the first kanban board.`);
    if (tasks.length > 0) {
      console.log("Task [0] title:", tasks[0].title);
      console.log("Type of task [0] title:", typeof tasks[0].title);
    }
  } else {
    console.log("No kanban boards found");
  }

  process.exit(0);
}

debug().catch(console.error);
