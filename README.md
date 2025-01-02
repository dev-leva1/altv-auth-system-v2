# alt:V Authentication System

A modern authentication system for alt:V server with user registration and character creation functionality integrated with MySQL.

## Features

- User registration and authentication
- Character creation and management system
- Secure password storage using SHA256
- MySQL integration
- Modern and responsive UI
- Email and data validation
- Password strength requirements
- Animated camera during authentication
- Player state management
- Error handling and validation

## Requirements

- alt:V Server
- Node.js
- MySQL Server
- Required npm packages:
  - crypto-js
  - mysql2

## Installation

1. Copy the `auth` folder to your server's `resources` directory
2. Configure MySQL settings in `server/database.js`:
```js
const dbConfig = {
    host: 'your_host',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
};
```

3. Install dependencies:
```bash
cd resources/auth
npm install
```

4. Add the resource to your `server.toml`:
```toml
resources = [
  'auth'
]
```

## Database Structure

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);
```

### Characters Table
```sql
CREATE TABLE characters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    age INT NOT NULL,
    ethnicity VARCHAR(50) NOT NULL,
    appearance JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_played TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Security

- Minimum password length: 6 characters
- Email format validation
- Unique username and email
- Password hashing using SHA256
- SQL injection protection
- Character data validation

## Usage

### Registration
Players can register with:
- Username
- Email address
- Password (minimum 6 characters)
- Password confirmation

### Authentication
Login using:
- Username
- Password

### Character Creation
After authentication, players can:
- Create a new character
- Select an existing character
- Customize character appearance
- Delete characters

## Events

### Client Events
- `auth:showLoginForm` - Show login form
- `auth:loginResponse` - Login attempt response
- `auth:registerResponse` - Registration attempt response
- `auth:showCharacterCreator` - Show character creator
- `auth:characterResponse` - Character action response

### Server Events
- `auth:tryLogin` - Login attempt
- `auth:tryRegister` - Registration attempt
- `auth:createCharacter` - Character creation
- `auth:selectCharacter` - Character selection
- `auth:deleteCharacter` - Character deletion

## Error Handling

The system includes error handling for:
- Missing fields
- Invalid email format
- Password mismatch
- Duplicate username/email
- Database connection issues
- Authentication failures
- Character creation/selection errors
