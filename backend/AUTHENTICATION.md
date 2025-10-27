# PlanMyTrip Authentication System

## Overview

The PlanMyTrip application now includes a complete authentication system with signup, login, and user profile management. The system is designed to match the existing application's aesthetic and provides a seamless user experience.

## Features

### 🔐 Authentication Features
- **User Registration**: Create new accounts with email and password
- **User Login**: Sign in with existing credentials
- **Session Management**: Automatic session persistence using localStorage
- **User Profile**: Display user information with avatar initials
- **Logout**: Secure logout functionality
- **Social Login**: Placeholder for Google and Twitter integration

### 🎨 Design Features
- **Consistent Styling**: Matches the existing PlanMyTrip design system
- **Responsive Design**: Works on all device sizes
- **Smooth Animations**: CSS transitions and animations for better UX
- **Modal Interface**: Clean, centered authentication modal
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during authentication processes

## Components

### 1. AuthModal (`components/AuthModal.tsx`)
- Handles both login and signup forms
- Toggle between login and signup modes
- Form validation and error display
- Social login options (Google, Twitter)
- Loading states and animations

### 2. UserProfile (`components/UserProfile.tsx`)
- Displays user information when logged in
- Dropdown menu with profile options
- Avatar with user initials
- Settings, help, and logout options

### 3. Header (`components/Header.tsx`)
- Updated to include authentication buttons
- Shows user profile when authenticated
- Sign In/Get Started buttons for guests

### 4. AuthService (`services/authService.ts`)
- Handles all authentication logic
- Mock implementation for demonstration
- Session management with localStorage
- User data management

## Usage

### For Guests (Not Logged In)
1. Click "Sign In" or "Get Started" in the header
2. Choose between login or signup mode
3. Fill in the required information
4. Submit the form to authenticate

### For Authenticated Users
1. User profile is displayed in the header
2. Click on profile to access dropdown menu
3. Options include:
   - Edit Profile
   - Settings
   - Help & Support
   - Sign Out

## Mock Data

The system includes mock user data for testing:

### Existing Users
- **Email**: john@example.com
- **Email**: jane@example.com
- **Password**: Any password with 6+ characters

### New Users
- Can register with any email not already in use
- Password must be at least 6 characters
- Passwords must match during registration

## Technical Implementation

### State Management
- User state managed in App.tsx
- Authentication loading and error states
- Session persistence across page reloads

### Security Features
- Password validation (minimum 6 characters)
- Email format validation
- Session token generation
- Secure logout (clears all session data)

### Styling
- Tailwind CSS classes
- Custom CSS animations
- Responsive design
- Consistent with PlanMyTrip theme

## Future Enhancements

### Backend Integration
- Replace mock service with real API calls
- JWT token authentication
- Password hashing and security
- Email verification

### Additional Features
- Password reset functionality
- Email verification
- Two-factor authentication
- Profile picture upload
- Account deletion

### Social Login
- Google OAuth integration
- Twitter OAuth integration
- Facebook login
- Apple Sign In

## File Structure

```
components/
├── AuthModal.tsx          # Authentication modal component
├── UserProfile.tsx        # User profile dropdown
└── Header.tsx            # Updated header with auth

services/
└── authService.ts        # Authentication service

App.tsx                   # Main app with auth integration
index.html               # CSS animations for auth
```

## Testing

To test the authentication system:

1. **Login with existing user**:
   - Email: john@example.com
   - Password: any 6+ character password

2. **Create new account**:
   - Use any email not in the mock database
   - Password must be 6+ characters
   - Confirm password must match

3. **Test error handling**:
   - Try invalid email formats
   - Try short passwords
   - Try mismatched passwords
   - Try logging in with non-existent email

The system provides immediate feedback for all validation errors and authentication attempts.
