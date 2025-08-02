# E-Commerce Application

A full-stack e-commerce application built with React frontend and Node.js backend following MVC architecture principles.

## Features

- User authentication and authorization
- Product catalog with search functionality
- Shopping cart management
- Order processing system
- Admin panel for managing products, users, and orders
- Responsive design

## Tech Stack

**Frontend:**
- React.js with Redux for state management
- Tailwind CSS for styling
- React Router for navigation

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- RESTful API design

## Project Structure

```
ecommerce/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── screens/       # Page components (Views)
│   │   ├── actions/       # Redux actions
│   │   ├── reducers/      # Redux reducers
│   │   └── constants/     # Action type constants
│   └── package.json
├── backend/           # Node.js backend
│   ├── controllers/   # Business logic (Controllers)
│   ├── models/        # Database models (Models)
│   ├── routes/        # API routes
│   ├── middleware/    # Custom middleware
│   └── server.js      # Entry point
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Set up environment variables in backend/.env:
   ```
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

5. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

6. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

## API Endpoints

### Products
- GET /api/products - Get all products
- GET /api/products/:id - Get single product
- POST /api/products - Create product (Admin only)
- PUT /api/products/:id - Update product (Admin only)
- DELETE /api/products/:id - Delete product (Admin only)

### Users
- POST /api/users/login - User login
- POST /api/users/register - User registration
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile
- GET /api/users - Get all users (Admin only)

### Orders
- POST /api/orders - Create order
- GET /api/orders/:id - Get order by ID
- PUT /api/orders/:id/pay - Update order to paid
- GET /api/orders/myorders - Get logged in user orders
- GET /api/orders - Get all orders (Admin only)

## License

This project is open source and available under the MIT License.