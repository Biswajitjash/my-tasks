# Ticket Management System

A full-stack ticket management system with user authentication, ticket creation with image upload, and feedback functionality.

## 🌟 Features

### User Management
- **User Registration**: Create new accounts with username, email, and password
- **User Login**: Secure authentication with password hashing
- **Password Update**: Change password securely

### Ticket Management
- **Create Tickets**: Raise new tickets with title, description, category, priority
- **Image Upload**: Attach images to tickets (max 5MB)
- **Update Tickets**: Edit ticket details and status
- **Delete Tickets**: Remove tickets
- **Filter Tickets**: View tickets by status (All, Open, In Progress, Resolved)
- **Dashboard Statistics**: Real-time stats showing total, open, in-progress, and resolved tickets

### Feedback System
- **Submit Feedback**: Rate your experience (1-5 stars)
- **Link to Tickets**: Associate feedback with specific tickets
- **View History**: See all your submitted feedbacks

## 🏗️ Tech Stack

### Backend
- Node.js
- Express.js
- Multer (file upload)
- bcryptjs (password hashing)
- JSON file storage

### Frontend
- React 18
- React Router v6
- Axios
- Custom CSS with modern design

## 📁 Project Structure

```
ticket-system/
├── backend/
│   ├── server.js           # Main server file with all API endpoints
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── UserLogin.js
│   │   │   ├── UserCreate.js
│   │   │   ├── UserPasswordUpdate.js
│   │   │   ├── Dashboard.js
│   │   │   ├── TicketRaised.js
│   │   │   ├── TicketUpdate.js
│   │   │   ├── Feedbacks.js
│   │   │   └── Navbar.js
│   │   ├── styles/
│   │   │   └── App.css
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── data/                   # JSON data storage
│   ├── UserData.json
│   ├── UserTicket.json
│   └── UserFeedback.json
├── uploads/                # Uploaded images
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 3: Start the Backend Server

```bash
cd ../backend
npm start
```

The backend server will start on http://localhost:5000

### Step 4: Start the Frontend (in a new terminal)

```bash
cd frontend
npm start
```

The frontend will start on http://localhost:3000

## 📝 Usage Guide

### 1. Create an Account
- Navigate to http://localhost:3000
- Click "Create Account"
- Fill in your details (username, email, password, full name)
- Click "Create Account"

### 2. Login
- Enter your email and password
- Click "Sign In"

### 3. Create a Ticket
- Click "New Ticket" in the navigation or dashboard
- Fill in ticket details:
  - Title: Brief description
  - Description: Detailed information
  - Category: Select from dropdown
  - Priority: Low, Medium, or High
  - Image: Optional - upload screenshot or photo (max 5MB)
- Click "Submit Ticket"

### 4. Manage Tickets
- View all tickets in the Dashboard
- Filter by status: All, Open, In Progress, Resolved
- Edit ticket: Click "Edit" button on any ticket
- Delete ticket: Click "Delete" button (confirmation required)

### 5. Submit Feedback
- Navigate to "Feedback" in the navigation
- Click "+ New Feedback"
- Select a ticket (optional) or provide general feedback
- Rate your experience (1-5 stars)
- Add comments (optional)
- Click "Submit Feedback"

### 6. Change Password
- Click "Settings" in the navigation
- Enter current password
- Enter new password twice
- Click "Update Password"

## 🔌 API Endpoints

### User APIs
- `POST /api/users/register` - Create new user
- `POST /api/users/login` - Login user
- `PUT /api/users/:id/password` - Update password
- `GET /api/users/:id` - Get user details

### Ticket APIs
- `POST /api/tickets` - Create ticket (with image upload)
- `GET /api/tickets/user/:userId` - Get user's tickets
- `GET /api/tickets/:id` - Get specific ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Feedback APIs
- `POST /api/feedback` - Create feedback
- `GET /api/feedback/user/:userId` - Get user's feedbacks
- `GET /api/feedback/ticket/:ticketId` - Get ticket feedbacks
- `DELETE /api/feedback/:id` - Delete feedback

## 💾 Data Storage

All data is stored in JSON files:

### UserData.json
```json
[
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "password": "hashed_password",
    "fullName": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### UserTicket.json
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "Login Issue",
    "description": "Cannot login to dashboard",
    "category": "Technical",
    "priority": "High",
    "status": "Open",
    "image": "/uploads/1234567-screenshot.png",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### UserFeedback.json
```json
[
  {
    "id": 1,
    "userId": 1,
    "ticketId": 1,
    "rating": 5,
    "comment": "Great support!",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## 🎨 Design Features

- **Modern Dark Theme**: Sleek dark mode interface
- **Gradient Accents**: Beautiful blue-to-purple gradients
- **Glassmorphism**: Frosted glass effect on cards
- **Smooth Animations**: Fade-in, slide-down, and hover effects
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Custom Typography**: Bricolage Grotesque and JetBrains Mono fonts

## 🔒 Security Features

- Password hashing with bcryptjs
- Form validation
- File type and size validation for uploads
- Protected routes requiring authentication
- Session management with localStorage

## 🐛 Troubleshooting

### Backend won't start
- Ensure port 5000 is not in use
- Check Node.js version (v14+)
- Delete `node_modules` and run `npm install` again

### Frontend won't start
- Ensure port 3000 is not in use
- Check Node.js version (v14+)
- Clear browser cache
- Delete `node_modules` and run `npm install` again

### Images not displaying
- Check that backend server is running
- Verify image was uploaded successfully
- Check browser console for CORS errors

### Cannot login
- Verify user exists (check UserData.json)
- Ensure correct email and password
- Check backend console for errors

## 📧 Support

For issues or questions, please create a ticket in the system!

## 📄 License

This project is open source and available for educational purposes.

---

**Happy Ticketing! 🎫**
