# RU Promos Bot - Next.js Telegram Bot with Admin Dashboard

A comprehensive Next.js application that combines a Telegram bot for promo code management with a full-featured admin dashboard.

## Features

### Telegram Bot
- **Promo Code Validation**: Users can send promo codes to check validity, expiration, and details
- **Multi-language Support**: Supports Russian and English languages
- **Message Logging**: All interactions are logged to the database
- **User Management**: Automatic user registration and profile updates

### Admin Dashboard
- **Authentication**: JWT-based admin authentication
- **Dashboard**: Overview of statistics and recent activity
- **Promo Management**: Full CRUD operations for promo codes
- **Client Management**: View and search registered clients
- **Message History**: Browse all bot interactions with filtering
- **Real-time Stats**: Live statistics and analytics

## Tech Stack

- **Framework**: Next.js 14 (JavaScript)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens
- **UI**: Tailwind CSS with Lucide React icons
- **Bot**: node-telegram-bot-api
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Telegram Bot Token from @BotFather

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Environment Configuration**:
Create a `.env.local` file in the root directory:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ru_promos_bot

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_change_this_in_production

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

3. **Start the development server**:
```bash
npm run dev
```

4. **Set up the Telegram webhook**:
After deploying or using ngrok for local development, call:
```bash
POST /api/telegram/set-webhook
```

## Project Structure

```
├── components/
│   └── Layout.js                 # Main layout with navigation
├── lib/
│   ├── auth.js                   # JWT authentication utilities
│   ├── mongodb.js                # Database connection
│   └── telegram.js               # Telegram bot logic
├── models/
│   ├── Client.js                 # User/client model
│   ├── Message.js                # Message model
│   └── Promo.js                  # Promo code model
├── pages/
│   ├── api/
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── clients/              # Client management API
│   │   ├── dashboard/            # Dashboard stats API
│   │   ├── messages/             # Messages API
│   │   ├── promos/               # Promo management API
│   │   └── telegram/             # Bot webhook handlers
│   ├── admin/
│   │   ├── clients/              # Client management pages
│   │   ├── messages/             # Message history pages
│   │   ├── promos/               # Promo management pages
│   │   └── index.js              # Admin dashboard
│   ├── login.js                  # Admin login page
│   └── index.js                  # Home page (redirects to admin)
└── styles/
    └── globals.css               # Global styles with Tailwind
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/verify` - Token verification

### Promos
- `GET /api/promos` - List promos with pagination and search
- `POST /api/promos` - Create new promo
- `GET /api/promos/[id]` - Get specific promo
- `PUT /api/promos/[id]` - Update promo
- `DELETE /api/promos/[id]` - Delete promo

### Clients
- `GET /api/clients` - List clients with pagination and search

### Messages
- `GET /api/messages` - List messages with filtering and pagination

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Telegram
- `POST /api/telegram/webhook` - Telegram webhook handler
- `POST /api/telegram/set-webhook` - Set webhook URL

## Bot Commands

- `/start` - Welcome message and bot introduction
- `/help` - Show available commands
- Send any text - Check if it's a valid promo code

## Data Models

### Client
```javascript
{
  telegramId: String (unique),
  firstName: String,
  lastName: String,
  username: String,
  language: String,
  joinedAt: Date,
  isActive: Boolean
}
```

### Promo
```javascript
{
  code: String (unique, uppercase),
  minPrice: Number,
  expiresAt: Date,
  locations: [String],
  store: String,
  isActive: Boolean
}
```

### Message
```javascript
{
  messageId: String,
  clientId: ObjectId (ref: Client),
  type: String (enum),
  content: String,
  direction: String (incoming/outgoing),
  timestamp: Date,
  metadata: Mixed
}
```

## Deployment

### Production Deployment

1. **Build the application**:
```bash
npm run build
```

2. **Start production server**:
```bash
npm start
```

3. **Set environment variables** in your hosting platform

4. **Configure webhook** by calling the set-webhook endpoint with your production URL

### Environment Variables for Production

Make sure to set secure values for:
- `JWT_SECRET` - Use a strong, random secret
- `ADMIN_PASSWORD` - Use a secure password
- `MONGODB_URI` - Your production MongoDB connection string
- `TELEGRAM_WEBHOOK_URL` - Your production webhook URL

## Security Features

- JWT token authentication
- Password-based admin access
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- Database query protection with Mongoose

## Development

### Adding New Features

1. **API Routes**: Add new routes in `pages/api/`
2. **Models**: Define new models in `models/`
3. **Pages**: Create new admin pages in `pages/admin/`
4. **Components**: Add reusable components in `components/`

### Bot Logic

The bot logic is in `lib/telegram.js`. To add new commands or responses:

1. Update the `handleBotLogic` function
2. Add new message types to the enum in Message model if needed
3. Test with the webhook endpoint

## Monitoring and Logs

- All messages are logged to the database
- Console logs for debugging (check server logs)
- React Hot Toast for user notifications
- Error handling in all API routes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
