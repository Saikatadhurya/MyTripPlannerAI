# PLANORA Profile Management API Documentation

## Base URL
```
http://localhost:5000/api/profile
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get User Profile
**GET** `/api/profile`

Retrieves the current user's profile information including connected social accounts.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "social_accounts": [
        {
          "id": "uuid",
          "provider": "google",
          "provider_id": "google-user-id",
          "created_at": "2024-01-01T00:00:00Z"
        }
      ]
    }
  }
}
```

---

### 2. Update Profile Information
**PUT** `/api/profile`

Updates the user's profile information (full_name and/or email).

**Request Body:**
```json
{
  "full_name": "John Smith",
  "email": "johnsmith@example.com"
}
```

**Validation Rules:**
- `full_name`: Optional, 2-100 characters, letters and spaces only
- `email`: Optional, valid email format, must be unique

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "full_name": "John Smith",
      "email": "johnsmith@example.com",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Error Responses:**
- `400`: Validation errors
- `409`: Email already exists
- `404`: User not found

---

### 3. Change Password
**POST** `/api/profile/change-password`

Changes the user's password after verifying the current password.

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123!"
}
```

**Validation Rules:**
- `currentPassword`: Required, minimum 8 characters
- `newPassword`: Required, minimum 8 characters, must contain uppercase, lowercase, number, and special character

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Error Responses:**
- `400`: Validation errors or same password
- `401`: Current password incorrect
- `404`: User not found

---

### 4. Get Social Accounts
**GET** `/api/profile/social-accounts`

Retrieves all connected social accounts for the current user.

**Response:**
```json
{
  "success": true,
  "data": {
    "social_accounts": [
      {
        "id": "uuid",
        "provider": "google",
        "provider_id": "google-user-id",
        "created_at": "2024-01-01T00:00:00Z"
      },
      {
        "id": "uuid",
        "provider": "twitter",
        "provider_id": "twitter-user-id",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 5. Connect Social Account
**POST** `/api/profile/social-accounts`

Connects a new social account (Google or Twitter) to the user's profile.

**Request Body:**
```json
{
  "provider": "google",
  "providerId": "google-user-id-123"
}
```

**Validation Rules:**
- `provider`: Required, must be "google" or "twitter"
- `providerId`: Required, string

**Response:**
```json
{
  "success": true,
  "message": "google account connected successfully",
  "data": {
    "social_account": {
      "id": "uuid",
      "provider": "google",
      "provider_id": "google-user-id-123",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Error Responses:**
- `400`: Validation errors
- `409`: Account already connected or provider ID already used

---

### 6. Disconnect Social Account
**DELETE** `/api/profile/social-accounts/:provider`

Disconnects a social account from the user's profile.

**URL Parameters:**
- `provider`: "google" or "twitter"

**Response:**
```json
{
  "success": true,
  "message": "google account disconnected successfully"
}
```

**Error Responses:**
- `400`: Invalid provider
- `404`: Account not found or already disconnected

---

### 7. Delete Account
**DELETE** `/api/profile`

Permanently deletes the user's account and all associated data.

**Request Body:**
```json
{
  "password": "userPassword123"
}
```

**Validation Rules:**
- `password`: Required, minimum 8 characters

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Error Responses:**
- `400`: Validation errors
- `401`: Invalid password
- `404`: User not found

---

## Error Response Format

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

## Security Features

1. **JWT Authentication**: All endpoints require valid JWT tokens
2. **Input Validation**: Comprehensive validation using express-validator
3. **Input Sanitization**: Automatic sanitization of user inputs
4. **SQL Injection Prevention**: Parameterized queries with pg
5. **Password Security**: bcrypt hashing with 12 salt rounds
6. **Email Uniqueness**: Prevents duplicate email addresses
7. **Social Account Validation**: Prevents duplicate social account connections

## Database Operations

- **Cascade Deletes**: Deleting a user automatically removes all social accounts
- **Transaction Safety**: Account deletion uses database transactions
- **Foreign Key Constraints**: Maintains data integrity
- **Timestamps**: Automatic tracking of created_at and updated_at

## Rate Limiting & Security Headers

Consider implementing:
- Rate limiting for sensitive operations
- Security headers (helmet.js)
- Request logging
- CORS configuration for production
