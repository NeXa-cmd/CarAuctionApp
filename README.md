# Car Auction App

A mobile application for car auctions built with React Native, Node.js, and MongoDB.

## Project Structure

The project consists of three main parts:
- `/backend` - Node.js/Express backend server
- `/admin-dashboard` - React admin dashboard
- Mobile app (root directory) - React Native mobile application

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v14 or later)
- npm (v6 or later)
- MongoDB (v4.4 or later)
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS dependencies)

## Environment Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env file with your MongoDB connection string and other configurations
# Example:
# MONGODB_URI=mongodb://localhost:27017/car-auction
# JWT_SECRET=your-secret-key
# PORT=5001
```

### 2. Admin Dashboard Setup

```bash
# Navigate to admin dashboard directory
cd admin-dashboard

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env file with your backend API URL
# Example:
# REACT_APP_API_URL=http://localhost:5001/api
```

### 3. Mobile App Setup

```bash
# In the root directory

# Install dependencies
npm install

# Install iOS dependencies
cd ios
pod install
cd ..

# Create .env file
cp .env.example .env

# Update .env file with your backend API URL
# Example:
# API_URL=http://localhost:5001/api
```

## Running the Application

### 1. Start Backend Server

```bash
cd backend
npm start
```

The backend server will start on http://localhost:5001

### 2. Start Admin Dashboard

```bash
cd admin-dashboard
npm start
```

The admin dashboard will open in your browser at http://localhost:3000

### 3. Start Mobile App

#### iOS
```bash
# Start Metro bundler
npx react-native start

# In a new terminal, run iOS app
npx react-native run-ios
```

#### Android
```bash
# Start Metro bundler
npx react-native start

# In a new terminal, run Android app
npx react-native run-android
```

## Initial Setup

1. First, start the backend server
2. Create an admin account using the provided script:
```bash
cd backend
node src/scripts/createAdmin.js
```
This will create an admin account with:
- Email: admin@example.com
- Password: admin123

3. Log in to the admin dashboard and create some car listings
4. Create a regular user account through the mobile app

## Common Issues and Solutions

### iOS Build Issues
If you encounter iOS build issues:
```bash
cd ios
pod deintegrate
pod install
```

### Android Build Issues
If you encounter Android build issues:
```bash
cd android
./gradlew clean
```

### Metro Bundler Issues
If Metro bundler shows cached file issues:
```bash
npx react-native start --reset-cache
```

## API Documentation

The backend API is available at:
- Base URL: http://localhost:5001/api
- Documentation: http://localhost:5001/api-docs (when running in development mode)

Main endpoints:
- Authentication: `/api/auth/*`
- Cars: `/api/cars/*`
- Auctions: `/api/auctions/*`
- Users: `/api/users/*`

## Features

- User authentication (login/register)
- Real-time auction updates
- Car listing management
- Bidding system
- Profile management
- Image upload
- Admin dashboard for managing cars and auctions

## Tech Stack

- **Frontend Mobile**: React Native
- **Frontend Admin**: React
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Real-time Updates**: Socket.IO
- **State Management**: React Context
- **Image Storage**: Local file system
- **Authentication**: JWT

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

For any issues or questions, please contact the development team.

## Database Migration

### Exporting the Database
To export your MongoDB database:
```bash
# Replace car-auction with your database name
mongodump --db car-auction --out ./backup

# This will create a backup directory containing:
# - car-auction/
#   - users.bson
#   - cars.bson
#   - auctions.bson
#   - etc...
```

### Importing the Database
To import the database on another computer:
```bash
# First, copy the backup directory to the new computer
# Then, run:
mongorestore --db car-auction ./backup/car-auction
```

Note: Ensure MongoDB is installed and running on both computers before performing these operations.
