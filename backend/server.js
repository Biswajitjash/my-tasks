const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ❌ REMOVED: const { use } = require('react'); — React does not belong in Node.js backend

const app = express();
const PORT = process.env.PORT || 5000;

// ============= CORS CONFIGURATION =============
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight requests
app.options('*', cors());

app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============= MULTER CONFIG =============
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// ============= HELPER FUNCTIONS =============
const dataDir = path.join(__dirname, '../data');

const ensureDataDir = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const readJSON = (filename) => {
  ensureDataDir();
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return [];
  }
};

const writeJSON = (filename, data) => {
  ensureDataDir();
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// ============= INITIALIZE DATA FILES =============
const initializeDataFiles = () => {
  ensureDataDir();
  if (!fs.existsSync(path.join(dataDir, 'UserData.json'))) {
    writeJSON('UserData.json', []);
  }
  if (!fs.existsSync(path.join(dataDir, 'UserTicket.json'))) {
    writeJSON('UserTicket.json', []);
  }
  if (!fs.existsSync(path.join(dataDir, 'UserFeedback.json'))) {
    writeJSON('UserFeedback.json', []);
  }
};

initializeDataFiles();

// ============= USER ROUTES =============

// Register
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const users = readJSON('UserData.json');

    if (users.find(u => u.email === email || u.username === username)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      email,
      password: hashedPassword,
      fullName,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeJSON('UserData.json', users);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'User created successfully', user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Login
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = readJSON('UserData.json');
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Login successful', user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Update Password
app.put('/api/users/:id/password', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const users = readJSON('UserData.json');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, users[userIndex].password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    users[userIndex].password = await bcrypt.hash(newPassword, 10);
    users[userIndex].updatedAt = new Date().toISOString();

    writeJSON('UserData.json', users);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get All Users (Safe - No Password)
app.get('/api/users', (req, res) => {
  try {
    const users = readJSON('UserData.json');
    const safeUsers = users.map(u => ({ id: u.id, username: u.username }));
    console.log("Fetched users:", safeUsers);
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get User by ID
app.get('/api/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const users = readJSON('UserData.json');
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============= TICKET ROUTES =============

// Create Ticket
app.post('/api/tickets', upload.single('image'), (req, res) => {
  try {
    const { userId, title, description, category, priority, userTo, feedback } = req.body;

    if (!userId || !title || !description || !userTo) {
      return res.status(400).json({ error: `All required fields must be provid ${userId}:${description}:${userTo}` });
    }

    const tickets = readJSON('UserTicket.json');

    const newTicket = {
      id: tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1,
      userId: parseInt(userId),
      title,
      description,
      category: category || 'General',
      priority: priority || 'Medium',
      userTo: parseInt(userTo),
      status: 'Open',
      feedback: parseInt(feedback),
      image: req.file ? `/uploads/${req.file.filename}` : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tickets.push(newTicket);
    writeJSON('UserTicket.json', tickets);

    res.status(201).json({ message: 'Ticket created successfully', ticket: newTicket });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get all tickets for a user (creator OR assignee)
app.get('/api/tickets/user/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const tickets = readJSON('UserTicket.json');
    const userTickets = tickets.filter(t => t.userId === userId || t.userTo === userId);
    console.log(`Fetched ${userTickets.length} tickets for user ${userId}`);
    res.json(userTickets);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get all tickets
app.get('/api/tickets', (req, res) => {
  try {
    const tickets = readJSON('UserTicket.json');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get ticket by ID
app.get('/api/tickets/:id', (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const tickets = readJSON('UserTicket.json');
    const ticket = tickets.find(t => t.id === ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    console.log(`Fetched ticket ${ticketId}:`, ticket);
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============================================================
// NEW: Dedicated feedback update route (for Resolved tickets)
// ============================================================
app.put('/api/tickets/:id/feedback', (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { feedback } = req.body;

    if (!feedback || feedback < 1 || feedback > 5) {
      return res.status(400).json({ error: 'Feedback must be between 1 and 5' });
    }

    const tickets = readJSON('UserTicket.json');
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);

    if (ticketIndex === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[ticketIndex];

    // Update only feedback field
    tickets[ticketIndex] = {
      ...ticket,
      feedback: parseInt(feedback),
      updatedAt: new Date().toISOString()
    };

    writeJSON('UserTicket.json', tickets);
    console.log(`Updated feedback for ticket ${ticketId}: ${feedback}/5`);

    res.json({
      message: 'Feedback submitted successfully',
      ticket: tickets[ticketIndex]
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============================================================
// Existing ticket update route (for non-Resolved tickets)
// ============================================================

app.put('/api/tickets/:id', upload.single('image'), (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { title, description, category, priority, status, userTo, feedback } = req.body;

    if (!ticketId || !title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const tickets = readJSON('UserTicket.json');
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);

    if (ticketIndex === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[ticketIndex];

    // ✅ Migrate old single image to array if needed
    let currentImages = [];
    if (Array.isArray(ticket.images)) {
      currentImages = ticket.images;
    } else if (ticket.image) {
      currentImages = [ticket.image];
    }

    // ✅ If new file uploaded via update form, append it
    if (req.file) {
      currentImages = [...currentImages, `/uploads/${req.file.filename}`];
    }

    // Safely parse userTo
    const parsedUserTo = userTo !== undefined && userTo !== ''
      ? parseInt(userTo)
      : ticket.userTo;

        // Safely parse feedback
    const parsedFeedback = feedback !== undefined && feedback !== ''
      ? parseInt(feedback)
      : ticket.feedback;

    tickets[ticketIndex] = {
      ...ticket,
      title: title || ticket.title,
      description: description || ticket.description,
      category: category || ticket.category,
      priority: priority || ticket.priority,
      status: status || ticket.status,
      userTo: parsedUserTo,
      feedback: parsedFeedback,
      images: currentImages, // ✅ Always array
      image: null,           // ✅ Clear old single image field
      updatedAt: new Date().toISOString()
    };

    writeJSON('UserTicket.json', tickets);
    console.log(`Updated ticket ${ticketId}:`, tickets[ticketIndex]);

    res.json({
      message: 'Ticket updated successfully',
      ticket: tickets[ticketIndex]
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});




// Add more images to an existing ticket
app.post('/api/tickets/:id/images', upload.array('images', 5), (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const tickets = readJSON('UserTicket.json');
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);

    if (ticketIndex === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[ticketIndex];

    // ✅ Migrate old single `image` string to `images` array if needed
    let existingImages = [];
    if (Array.isArray(ticket.images)) {
      existingImages = ticket.images;
    } else if (ticket.image) {
      existingImages = [ticket.image]; // migrate old single image
    }

    // ✅ Append new uploaded images
    const newImagePaths = req.files.map(f => `/uploads/${f.filename}`);
    const updatedImages = [...existingImages, ...newImagePaths];

    tickets[ticketIndex] = {
      ...ticket,
      images: updatedImages, // ✅ Always array from now on
      image: null,           // ✅ Clear old single image field
      updatedAt: new Date().toISOString()
    };

    writeJSON('UserTicket.json', tickets);

    console.log(`Added ${newImagePaths.length} image(s) to ticket ${ticketId}`);

    res.json({
      message: 'Images added successfully',
      images: updatedImages,
      ticket: tickets[ticketIndex]
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});












// Delete Ticket
app.delete('/api/tickets/:id', (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const tickets = readJSON('UserTicket.json');
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);

    if (ticketIndex === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Delete associated image if exists
    if (tickets[ticketIndex].image) {
      const imagePath = path.join(__dirname, '..', tickets[ticketIndex].image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    tickets.splice(ticketIndex, 1);
    writeJSON('UserTicket.json', tickets);

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============= FEEDBACK ROUTES =============

// Create Feedback
app.post('/api/feedback', (req, res) => {
  try {
    const { userId, ticketId, rating, comment } = req.body;

    if (!userId || !rating) {
      return res.status(400).json({ error: 'UserId and rating are required' });
    }

    const feedbacks = readJSON('UserFeedback.json');

    const newFeedback = {
      id: feedbacks.length > 0 ? Math.max(...feedbacks.map(f => f.id)) + 1 : 1,
      userId: parseInt(userId),
      ticketId: ticketId ? parseInt(ticketId) : null,
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    feedbacks.push(newFeedback);
    writeJSON('UserFeedback.json', feedbacks);

    res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get all feedbacks for a user
app.get('/api/feedback/user/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const feedbacks = readJSON('UserFeedback.json');
    const userFeedbacks = feedbacks.filter(f => f.userId === userId);
    res.json(userFeedbacks);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get all feedbacks
app.get('/api/feedback', (req, res) => {
  try {
    const feedbacks = readJSON('UserFeedback.json');
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get feedback by ticket ID
app.get('/api/feedback/ticket/:ticketId', (req, res) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const feedbacks = readJSON('UserFeedback.json');
    const ticketFeedbacks = feedbacks.filter(f => f.ticketId === ticketId);
    res.json(ticketFeedbacks);
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Delete Feedback
app.delete('/api/feedback/:id', (req, res) => {
  try {
    const feedbackId = parseInt(req.params.id);
    const feedbacks = readJSON('UserFeedback.json');
    const feedbackIndex = feedbacks.findIndex(f => f.id === feedbackId);

    if (feedbackIndex === -1) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    feedbacks.splice(feedbackIndex, 1);
    writeJSON('UserFeedback.json', feedbacks);

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ============= HEALTH CHECK =============
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// ============= START SERVER =============
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 CORS enabled for all origins`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}`);
});

// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const multer = require('multer');
// const bcrypt = require('bcryptjs');
// const fs = require('fs');
// const path = require('path');

// // ❌ REMOVED: const { use } = require('react'); — React does not belong in Node.js backend

// const app = express();
// const PORT = process.env.PORT || 5000;

// // ============= CORS CONFIGURATION =============
// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
// }));

// // Handle preflight requests
// app.options('*', cors());

// app.use(bodyParser.json());
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// // ============= MULTER CONFIG =============
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(__dirname, '../uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + '-' + file.originalname);
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|gif/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);
//     if (mimetype && extname) {
//       return cb(null, true);
//     }
//     cb(new Error('Only image files are allowed!'));
//   }
// });

// // ============= HELPER FUNCTIONS =============
// const dataDir = path.join(__dirname, '../data');

// const ensureDataDir = () => {
//   if (!fs.existsSync(dataDir)) {
//     fs.mkdirSync(dataDir, { recursive: true });
//   }
// };

// const readJSON = (filename) => {
//   ensureDataDir();
//   const filePath = path.join(dataDir, filename);
//   if (!fs.existsSync(filePath)) {
//     return [];
//   }
//   try {
//     return JSON.parse(fs.readFileSync(filePath, 'utf8'));
//   } catch (error) {
//     return [];
//   }
// };

// const writeJSON = (filename, data) => {
//   ensureDataDir();
//   const filePath = path.join(dataDir, filename);
//   fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
// };

// // ============= INITIALIZE DATA FILES =============
// const initializeDataFiles = () => {
//   ensureDataDir();
//   if (!fs.existsSync(path.join(dataDir, 'UserData.json'))) {
//     writeJSON('UserData.json', []);
//   }
//   if (!fs.existsSync(path.join(dataDir, 'UserTicket.json'))) {
//     writeJSON('UserTicket.json', []);
//   }
//   if (!fs.existsSync(path.join(dataDir, 'UserFeedback.json'))) {
//     writeJSON('UserFeedback.json', []);
//   }
// };

// initializeDataFiles();

// // ============= USER ROUTES =============

// // Register
// app.post('/api/users/register', async (req, res) => {
//   try {
//     const { username, email, password, fullName } = req.body;

//     if (!username || !email || !password || !fullName) {
//       return res.status(400).json({ error: 'All fields are required' });
//     }

//     const users = readJSON('UserData.json');

//     if (users.find(u => u.email === email || u.username === username)) {
//       return res.status(409).json({ error: 'User already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = {
//       id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
//       username,
//       email,
//       password: hashedPassword,
//       fullName,
//       createdAt: new Date().toISOString()
//     };

//     users.push(newUser);
//     writeJSON('UserData.json', users);

//     const { password: _, ...userWithoutPassword } = newUser;
//     res.status(201).json({ message: 'User created successfully', user: userWithoutPassword });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // Login
// app.post('/api/users/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ error: 'Email and password are required' });
//     }

//     const users = readJSON('UserData.json');
//     const user = users.find(u => u.email === email);

//     if (!user) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const isValidPassword = await bcrypt.compare(password, user.password);

//     if (!isValidPassword) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const { password: _, ...userWithoutPassword } = user;
//     res.json({ message: 'Login successful', user: userWithoutPassword });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // Update Password
// app.put('/api/users/:id/password', async (req, res) => {
//   try {
//     const userId = parseInt(req.params.id);
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ error: 'Current and new password are required' });
//     }

//     const users = readJSON('UserData.json');
//     const userIndex = users.findIndex(u => u.id === userId);

//     if (userIndex === -1) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const isValidPassword = await bcrypt.compare(currentPassword, users[userIndex].password);

//     if (!isValidPassword) {
//       return res.status(401).json({ error: 'Current password is incorrect' });
//     }

//     users[userIndex].password = await bcrypt.hash(newPassword, 10);
//     users[userIndex].updatedAt = new Date().toISOString();

//     writeJSON('UserData.json', users);
//     res.json({ message: 'Password updated successfully' });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // Get All Users (Safe - No Password)
// app.get('/api/users', (req, res) => {
//   try {
//     const users = readJSON('UserData.json');
//     const safeUsers = users.map(u => ({ id: u.id, username: u.username }));
//     console.log("Fetched users:", safeUsers);
//     res.json(safeUsers);
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Get User by ID
// app.get('/api/users/:id', (req, res) => {
//   try {
//     const userId = parseInt(req.params.id);
//     const users = readJSON('UserData.json');
//     const user = users.find(u => u.id === userId);

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const { password: _, ...userWithoutPassword } = user;
//     res.json(userWithoutPassword);
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // ============= TICKET ROUTES =============

// // Create Ticket
// app.post('/api/tickets', upload.single('image'), (req, res) => {
//   try {
//     const { userId, title, description, category, priority, userTo, feedback } = req.body;

//     if (!userId || !title || !description || !userTo) {
//       return res.status(400).json({ error: `All required fields must be provid ${userId}:${description}:${userTo}` });
//     }

//     const tickets = readJSON('UserTicket.json');

//     const newTicket = {
//       id: tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1,
//       userId: parseInt(userId),
//       title,
//       description,
//       category: category || 'General',
//       priority: priority || 'Medium',
//       userTo: parseInt(userTo),
//       status: 'Open',
//       feedback: parseInt(feedback),
//       image: req.file ? `/uploads/${req.file.filename}` : null,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };

//     tickets.push(newTicket);
//     writeJSON('UserTicket.json', tickets);

//     res.status(201).json({ message: 'Ticket created successfully', ticket: newTicket });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // Get all tickets for a user (creator OR assignee)
// app.get('/api/tickets/user/:userId', (req, res) => {
//   try {
//     const userId = parseInt(req.params.userId);
//     const tickets = readJSON('UserTicket.json');
//     const userTickets = tickets.filter(t => t.userId === userId || t.userTo === userId);
//     console.log(`Fetched ${userTickets.length} tickets for user ${userId}`);
//     res.json(userTickets);
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // Get all tickets
// app.get('/api/tickets', (req, res) => {
//   try {
//     const tickets = readJSON('UserTicket.json');
//     res.json(tickets);
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // Get ticket by ID
// app.get('/api/tickets/:id', (req, res) => {
//   try {
//     const ticketId = parseInt(req.params.id);
//     const tickets = readJSON('UserTicket.json');
//     const ticket = tickets.find(t => t.id === ticketId);

//     if (!ticket) {
//       return res.status(404).json({ error: 'Ticket not found' });
//     }

//     console.log(`Fetched ticket ${ticketId}:`, ticket);
//     res.json(ticket);
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // ============================================================
// // ALSO UPDATE your existing PUT /api/tickets/:id route
// // to handle the images array properly:
// // ============================================================

// app.put('/api/tickets/:id', upload.single('image'), (req, res) => {
//   try {
//     const ticketId = parseInt(req.params.id);
//     const { title, description, category, priority, status, userTo, feedback } = req.body;

//     if (!ticketId || !title || !description) {
//       return res.status(400).json({ error: 'Title and description are required' });
//     }

//     const tickets = readJSON('UserTicket.json');
//     const ticketIndex = tickets.findIndex(t => t.id === ticketId);

//     if (ticketIndex === -1) {
//       return res.status(404).json({ error: 'Ticket not found' });
//     }

//     const ticket = tickets[ticketIndex];

//     // ✅ Migrate old single image to array if needed
//     let currentImages = [];
//     if (Array.isArray(ticket.images)) {
//       currentImages = ticket.images;
//     } else if (ticket.image) {
//       currentImages = [ticket.image];
//     }

//     // ✅ If new file uploaded via update form, append it
//     if (req.file) {
//       currentImages = [...currentImages, `/uploads/${req.file.filename}`];
//     }

//     // Safely parse userTo
//     const parsedUserTo = userTo !== undefined && userTo !== ''
//       ? parseInt(userTo)
//       : ticket.userTo;

//         // Safely parse feedback
//     const parsedFeedback = feedback !== undefined && feedback !== ''
//       ? parseInt(feedback)
//       : ticket.feedback;

//     tickets[ticketIndex] = {
//       ...ticket,
//       title: title || ticket.title,
//       description: description || ticket.description,
//       category: category || ticket.category,
//       priority: priority || ticket.priority,
//       status: status || ticket.status,
//       userTo: parsedUserTo,
//       feedback: parsedFeedback,
//       images: currentImages, // ✅ Always array
//       image: null,           // ✅ Clear old single image field
//       updatedAt: new Date().toISOString()
//     };

//     writeJSON('UserTicket.json', tickets);
//     console.log(`Updated ticket ${ticketId}:`, tickets[ticketIndex]);

//     res.json({
//       message: 'Ticket updated successfully',
//       ticket: tickets[ticketIndex]
//     });

//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });




// // Add more images to an existing ticket
// app.post('/api/tickets/:id/images', upload.array('images', 5), (req, res) => {
//   try {
//     const ticketId = parseInt(req.params.id);

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ error: 'No images provided' });
//     }

//     const tickets = readJSON('UserTicket.json');
//     const ticketIndex = tickets.findIndex(t => t.id === ticketId);

//     if (ticketIndex === -1) {
//       return res.status(404).json({ error: 'Ticket not found' });
//     }

//     const ticket = tickets[ticketIndex];

//     // ✅ Migrate old single `image` string to `images` array if needed
//     let existingImages = [];
//     if (Array.isArray(ticket.images)) {
//       existingImages = ticket.images;
//     } else if (ticket.image) {
//       existingImages = [ticket.image]; // migrate old single image
//     }

//     // ✅ Append new uploaded images
//     const newImagePaths = req.files.map(f => `/uploads/${f.filename}`);
//     const updatedImages = [...existingImages, ...newImagePaths];

//     tickets[ticketIndex] = {
//       ...ticket,
//       images: updatedImages, // ✅ Always array from now on
//       image: null,           // ✅ Clear old single image field
//       updatedAt: new Date().toISOString()
//     };

//     writeJSON('UserTicket.json', tickets);

//     console.log(`Added ${newImagePaths.length} image(s) to ticket ${ticketId}`);

//     res.json({
//       message: 'Images added successfully',
//       images: updatedImages,
//       ticket: tickets[ticketIndex]
//     });

//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });












// // Delete Ticket
// app.delete('/api/tickets/:id', (req, res) => {
//   try {
//     const ticketId = parseInt(req.params.id);
//     const tickets = readJSON('UserTicket.json');
//     const ticketIndex = tickets.findIndex(t => t.id === ticketId);

//     if (ticketIndex === -1) {
//       return res.status(404).json({ error: 'Ticket not found' });
//     }

//     // Delete associated image if exists
//     if (tickets[ticketIndex].image) {
//       const imagePath = path.join(__dirname, '..', tickets[ticketIndex].image);
//       if (fs.existsSync(imagePath)) {
//         fs.unlinkSync(imagePath);
//       }
//     }

//     tickets.splice(ticketIndex, 1);
//     writeJSON('UserTicket.json', tickets);

//     res.json({ message: 'Ticket deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // ============= FEEDBACK ROUTES =============

// // Create Feedback
// app.post('/api/feedback', (req, res) => {
//   try {
//     const { userId, ticketId, rating, comment } = req.body;

//     if (!userId || !rating) {
//       return res.status(400).json({ error: 'UserId and rating are required' });
//     }

//     const feedbacks = readJSON('UserFeedback.json');

//     const newFeedback = {
//       id: feedbacks.length > 0 ? Math.max(...feedbacks.map(f => f.id)) + 1 : 1,
//       userId: parseInt(userId),
//       ticketId: ticketId ? parseInt(ticketId) : null,
//       rating: parseInt(rating),
//       comment: comment || '',
//       createdAt: new Date().toISOString()
//     };

//     feedbacks.push(newFeedback);
//     writeJSON('UserFeedback.json', feedbacks);

//     res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // Get all feedbacks for a user
// app.get('/api/feedback/user/:userId', (req, res) => {
//   try {
//     const userId = parseInt(req.params.userId);
//     const feedbacks = readJSON('UserFeedback.json');
//     const userFeedbacks = feedbacks.filter(f => f.userId === userId);
//     res.json(userFeedbacks);
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // Get all feedbacks
// app.get('/api/feedback', (req, res) => {
//   try {
//     const feedbacks = readJSON('UserFeedback.json');
//     res.json(feedbacks);
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // Get feedback by ticket ID
// app.get('/api/feedback/ticket/:ticketId', (req, res) => {
//   try {
//     const ticketId = parseInt(req.params.ticketId);
//     const feedbacks = readJSON('UserFeedback.json');
//     const ticketFeedbacks = feedbacks.filter(f => f.ticketId === ticketId);
//     res.json(ticketFeedbacks);
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // Delete Feedback
// app.delete('/api/feedback/:id', (req, res) => {
//   try {
//     const feedbackId = parseInt(req.params.id);
//     const feedbacks = readJSON('UserFeedback.json');
//     const feedbackIndex = feedbacks.findIndex(f => f.id === feedbackId);

//     if (feedbackIndex === -1) {
//       return res.status(404).json({ error: 'Feedback not found' });
//     }

//     feedbacks.splice(feedbackIndex, 1);
//     writeJSON('UserFeedback.json', feedbacks);

//     res.json({ message: 'Feedback deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error: ' + error.message });
//   }
// });

// // ============= HEALTH CHECK =============
// app.get('/health', (req, res) => {
//   res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
// });

// // ============= START SERVER =============
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📡 CORS enabled for all origins`);
//   console.log(`🔗 API Base URL: http://localhost:${PORT}`);
// });


