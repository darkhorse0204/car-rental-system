const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  email: {
    type: String,
    required: function() {
      // Only require email for new user registration
      return this.isNew;
    },
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

const User = mongoose.model('User', userSchema);

// Car Schema
const carSchema = new mongoose.Schema({
  id: Number,
  type: String,
  brand: String,
  model: String,
  year: Number,
  transmission: String,
  fuel: String,
  seats: Number,
  available: Boolean,
  pricePerKm: Number,
  features: [String]
});

// Booking Schema
const bookingSchema = new mongoose.Schema({
  carId: Number,
  customerName: String,
  mobileNumber: String,
  startDate: Date,
  endDate: Date,
  estimatedKm: Number,
  totalAmount: Number,
  status: String,
  bookingDate: { type: Date, default: Date.now }
});

const Car = mongoose.model('Car', carSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// Initialize cars if none exist
async function initializeCars() {
  const count = await Car.countDocuments();
  if (count === 0) {
    const initialCars = [
      {
        id: 1,
        type: "Sedan",
        brand: "Toyota",
        model: "Corolla",
        year: 2023,
        transmission: "Automatic",
        fuel: "Petrol",
        seats: 5,
        available: true,
        pricePerKm: 12,
        features: ["Bluetooth", "Air Conditioning", "GPS", "Airbags"]
      },
      {
        id: 2,
        type: "SUV",
        brand: "Honda",
        model: "CR-V",
        year: 2023,
        transmission: "Automatic",
        fuel: "Petrol",
        seats: 7,
        available: true,
        pricePerKm: 15,
        features: ["Bluetooth", "Air Conditioning", "GPS", "Airbags", "Sunroof"]
      },
      {
        id: 3,
        type: "Hatchback",
        brand: "Volkswagen",
        model: "Golf",
        year: 2023,
        transmission: "Manual",
        fuel: "Petrol",
        seats: 5,
        available: true,
        pricePerKm: 10,
        features: ["Bluetooth", "Air Conditioning", "GPS", "Airbags"]
      },
      {
        id: 4,
        type: "Sedan",
        brand: "Hyundai",
        model: "Elantra",
        year: 2023,
        transmission: "Automatic",
        fuel: "Petrol",
        seats: 5,
        available: true,
        pricePerKm: 11,
        features: ["Bluetooth", "Air Conditioning", "GPS", "Airbags", "Leather Seats"]
      }
    ];
    await Car.insertMany(initialCars);
  }
}

// Initialize cars when server starts
initializeCars().catch(console.error);

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Validate input
    if (!username || !password || !email) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: existingUser.username === username ? 
          'Username already exists' : 
          'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username,
      password: hashedPassword,
      email
    });

    await user.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Registration successful! Please login.' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error during registration. Please try again.' 
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid username or password' 
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid username or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({ 
      success: true,
      message: 'Login successful',
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error during login. Please try again.' 
    });
  }
});

// Specific routes first
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Car API routes
app.get('/api/cars', async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/car-availability/:carId', async (req, res) => {
  try {
    const { carId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if car exists and is generally available
    const car = await Car.findOne({ id: parseInt(carId) });
    if (!car || !car.available) {
      return res.json({ available: false });
    }

    // Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      carId: parseInt(carId),
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ]
    });

    res.json({ available: overlappingBookings.length === 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();

    // Update car availability
    await Car.findOneAndUpdate(
      { id: req.body.carId },
      { $set: { available: false } }
    );

    res.json({ success: true, bookingId: booking._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ bookingDate: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Catch-all route last
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server with port fallback
const startServer = (port) => {
  if (port >= 65536) {
    console.error('No available ports found');
    process.exit(1);
  }

  const server = app.listen(port)
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, trying ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
      }
    })
    .on('listening', () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Open http://localhost:${port} in your browser`);
    });

  // Graceful shutdown handling
  const gracefulShutdown = () => {
    console.log('\nStarting graceful shutdown...');
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGUSR2', gracefulShutdown); // For nodemon restarts
  
  return server;
};

const PORT = parseInt(process.env.PORT) || 3000;
startServer(PORT); 