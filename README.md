# LMS-ai - AI-Powered Learning Management System

LMS-AI is a modern, real-time AI teaching platform that revolutionizes personalized education through interactive AI companions. Built with Next.js 15 and powered by cutting-edge AI voice technology, it offers immersive learning experiences across multiple subjects.

## 🌟 Features

### Core Functionality
- **AI Learning Companions**: Create and interact with personalized AI tutors for different subjects
- **Real-time Voice Conversations**: Seamless voice interactions powered by Vapi AI
- **Multi-subject Support**: Mathematics, Science, Language, History, Coding, and Economics
- **Session Management**: Track learning progress and session history
- **User Authentication**: Secure authentication with Clerk
- **Subscription Management**: Premium features with subscription tiers

### Learning Experience
- **Personalized Tutoring**: AI companions adapt to individual learning styles
- **Interactive Sessions**: Real-time voice-based learning sessions
- **Progress Tracking**: Monitor learning journey and completed sessions
- **Subject Filtering**: Easy discovery of companions by subject and topic
- **Companion Library**: Browse and launch pre-built learning companions

### User Management
- **Profile Dashboard**: View learning statistics and progress
- **Custom Companions**: Create personalized AI tutors with specific parameters
- **Session History**: Access previous learning sessions
- **Bookmarking**: Save favorite companions for quick access

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling framework
- **Radix UI** - Accessible UI components
- **Lucide React** - Modern icon library
- **Lottie React** - Smooth animations

### Backend & Services
- **Supabase** - Database and backend services
- **Clerk** - Authentication and user management
- **Vapi AI** - Voice AI integration
- **Sentry** - Error monitoring and performance tracking

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Zod** - Schema validation
- **React Hook Form** - Form management

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager
- Supabase account and project
- Clerk account for authentication
- Vapi AI account for voice functionality
- Sentry account for monitoring (optional)

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Vapi AI
NEXT_PUBLIC_WEB_TOKEN=your_vapi_web_token

# Sentry (Optional)
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lms-ai.git
   cd lms-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in all required environment variables

4. **Set up the database**
   - Create a new Supabase project
   - Set up the required tables (companions, session_history, etc.)
   - Configure Row Level Security (RLS) policies

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
lms-ai/
├── app/                    # Next.js App Router pages
│   ├── companions/         # Companion-related pages
│   ├── my-journey/         # User profile and progress
│   ├── subscription/       # Subscription management
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components (Radix)
│   ├── CompanionCard.tsx  # Companion display component
│   ├── CompanionForm.tsx  # Companion creation form
│   └── Navbar.tsx         # Navigation component
├── lib/                   # Utility libraries
│   ├── actions/           # Server actions
│   ├── supabase.ts        # Supabase client
│   ├── vapi.sdk.ts        # Vapi AI integration
│   └── utils.ts           # Helper utilities
├── constants/             # App constants
├── public/                # Static assets
└── middleware.ts          # Next.js middleware
```

## 🎯 Key Features Explained

### AI Companions
Users can create personalized AI tutors with customizable parameters:
- **Subject**: Choose from 6 subjects (Math, Science, Language, etc.)
- **Topic**: Specific learning focus
- **Voice**: Male or Female voice options
- **Style**: Formal or Casual teaching approach
- **Duration**: Estimated session length

### Voice Integration
Powered by Vapi AI, the platform provides:
- Real-time voice conversations
- Natural language processing
- Adaptive responses based on user needs
- Multiple voice personas

### User Management
- Secure authentication via Clerk
- Personal learning dashboard
- Progress tracking and analytics
- Subscription-based feature access

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 📊 Database Schema

### Main Tables
- **companions**: AI tutor configurations
- **session_history**: Learning session records
- **users**: User profiles and preferences

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The application can be deployed on any platform supporting Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Clerk](https://clerk.dev/) - Authentication service
- [Vapi AI](https://vapi.ai/) - Voice AI technology
- [Vercel](https://vercel.com/) - Deployment platform
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

## 📞 Support

For support, email support@converso.ai or join our Discord community.

## 🗺️ Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with external LMS platforms
- [ ] AI-powered assessment tools
- [ ] Collaborative learning features
