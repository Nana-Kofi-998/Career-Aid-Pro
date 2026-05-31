# Career-Aid Pro

**Hosted career guidance and mental wellness platform.** Career-Aid Pro combines a FastAPI backend, React frontend, secure accounts, AI coaching, CV tools, personality assessment, and child-friendly career exploration in one production-ready service.

![Status](https://img.shields.io/badge/status-stable-emerald)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.10+-emerald)
![Node](https://img.shields.io/badge/node-18+-emerald)

## Features

- **AI-Powered Chat** - Career coaching, mental wellness, and open Q&A modes
- **CV Analysis** - Upload and score CVs with structured AI feedback
- **CV Builder** - Create professional CVs with AI-assisted wording
- **Personality Assessment** - Generate detailed personality and temperament profiles
- **Junior Career Tools** - Age-appropriate exploration, quizzes, badges, and goal quests
- **Secure Hosted Workspace** - Account-based access with protected user data
- **Modern UI** - Responsive React interface with dark mode and polished interactions

## Using the Service

1. Create an account or sign in.
2. Complete onboarding so the app can personalize recommendations.
3. Use the dashboard to access AI chat, CV tools, personality insights, and learning progress.
4. Complete assessments fully before badges, goals, or profile progress are registered.
5. Retake supported assessments from their profile screens when a fresh result is needed.

## Architecture

```
Career-Aid-Pro/
├── api/                    # FastAPI backend
│   ├── main.py             # API application entry
│   ├── security.py         # JWT authentication
│   ├── schemas.py          # Pydantic models
│   ├── deps.py             # FastAPI dependencies
│   └── routers/            # API route handlers
│       ├── auth.py         # Login/register with rate limiting
│       ├── chat.py         # AI chat streaming
│       ├── chats.py        # Chat persistence
│       ├── cv.py           # CV upload and analysis
│       ├── cv_builder.py   # CV generation
│       ├── personality.py  # Personality assessment
│       └── users.py        # User profile and dashboard
├── career_aid_pro/         # Shared Python logic
│   ├── database.py         # SQLite persistence
│   ├── auth.py             # Password hashing
│   ├── config.py           # Configuration
│   ├── ai_client.py        # AI service integration
│   ├── cv_analysis.py      # CV scoring
│   ├── cv_builder.py       # CV generation
│   ├── validation.py       # Response validation
│   ├── web_search.py       # Search enrichment
│   └── services/           # Business logic
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # UI components
│   │   ├── context/        # React context
│   │   ├── pages/          # Route pages
│   │   └── utils/          # Utilities
│   └── package.json
├── .env.example            # Environment template
├── requirements.txt        # Python dependencies
└── README.md
```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CAREER_AID_JWT_SECRET` | Required in production. JWT signing key. |
| `CAREER_AID_CORS` | Comma-separated list of approved frontend origins. |
| `CAREER_AID_DB` | Database file or mounted data path for persistence. |
| `CAREER_AID_TOKEN_HOURS` | JWT token expiration window. |
| `CAREER_AID_MODEL_CAREER` | Career coaching model identifier. |
| `CAREER_AID_MODEL_MENTAL` | Mental wellness model identifier. |
| `CAREER_AID_MODEL_OPEN` | General chat model identifier. |
| `CAREER_AID_MODEL_VISION` | Vision model identifier for image/CV analysis. |

## API Reference

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in

### Chat
- `POST /api/chat/stream` - Stream AI response
- `GET /api/chats` - List conversations
- `GET /api/chats/{id}` - Get chat history
- `POST /api/chats` - Create new chat
- `DELETE /api/chats/{id}` - Delete chat

### CV
- `POST /api/cv/process` - Upload and analyze CV
- `POST /api/cv/extract` - Extract text from file
- `POST /api/cv/score` - Score CV and save result
- `POST /api/cv/score-text` - Score CV text
- `POST /api/cv-builder/generate` - Generate CV HTML

### Personality
- `GET /api/personality/questions` - Get assessment questions
- `GET /api/personality/profile` - Get user profile
- `POST /api/personality/submit` - Submit assessment
- `POST /api/personality/reset` - Retake assessment

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/dashboard` - Dashboard stats
- `PATCH /api/users/me/personality` - Update personality
- `DELETE /api/users/me` - Delete account

### System
- `GET /api/health` - Health check
- `GET /` - API info

## Security Features

- Rate limiting for authentication endpoints
- Input validation and request size limits
- JWT authentication with configurable expiration
- PBKDF2-HMAC-SHA256 password hashing
- Configurable CORS allowlist
- Parameterized database queries
- Account-based data access controls

## Design System

The UI uses a polished, responsive design system with:

- Dark mode and accessible contrast
- Dense dashboard layouts for repeated use
- Smooth transitions and meaningful feedback states
- Age-appropriate under-13 and over-13 experiences
- Structured cards for repeated items and focused tools

## Operational Notes

- Configure production secrets before deployment.
- Set approved CORS origins to the hosted frontend domains.
- Monitor `/api/health` for application and AI service availability.
- Review logs for failed uploads, authentication spikes, and AI service interruptions.
- Keep dependencies updated and run frontend and backend checks before release.

## License

MIT License.

## Credits

Built with:

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python API
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Lucide Icons](https://lucide.dev/) - Icon library
