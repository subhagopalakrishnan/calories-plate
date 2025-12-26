# 🍽️ Calories Plate - AI Food Calorie Calculator

A modern web application that uses AI to analyze food images and automatically calculate calories and nutritional information. Similar to CalAI but open-source and customizable. **The AI learns and improves from user corrections!**

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![Gemini AI](https://img.shields.io/badge/Gemini-2.0-4285f4)
![Supabase](https://img.shields.io/badge/Supabase-Database-3fcf8e)

## ✨ Features

- 📸 **Image Upload**: Upload or take a photo of your food
- 🤖 **AI-Powered Recognition**: Uses Google Gemini AI to identify food items
- 📊 **Nutritional Analysis**: Automatic calorie, protein, carbs, and fat calculations
- ✏️ **Editable Results**: Adjust portions, calories, and food names
- ➕ **Add Custom Items**: Manually add foods the AI missed
- 🗑️ **Remove Items**: Delete incorrect detections
- 🧠 **Self-Learning AI**: Gets smarter from user corrections
- 👤 **User Accounts**: Save meals and track daily intake
- 📈 **Daily Dashboard**: View your calorie tracking progress
- 🎨 **Modern UI**: Beautiful, responsive interface

## 🧠 AI Learning System

The app gets smarter over time through a self-learning system:

### How It Works

1. **User Corrections Saved**: When you edit a calorie value or portion, it's saved to the `user_corrections` table
2. **Aggregated Learning**: A database trigger calculates running averages in the `learned_foods` table
3. **Improved Prompts**: The next time anyone scans a similar food, the AI uses these verified values
4. **Confidence Scores**: Foods with more corrections have higher confidence (0-1 scale)

### Data Flow

```
User edits calories → Correction saved → Running average updated → AI prompt enhanced
                           ↓
                    learned_foods table
                    (food_name, avg_calories, sample_count, confidence)
```

### Feedback System

- 👍 **Thumbs Up**: Confirms the AI estimate was accurate
- 👎 **Thumbs Down**: Indicates the estimate needs improvement
- This feedback helps measure overall accuracy and identify problem areas

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Google Gemini API key (get one at [Google AI Studio](https://aistudio.google.com/app/apikey))
- Supabase account (for user auth and data storage)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/calories-plate.git
cd calories-plate
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase database:
   - Run the SQL from `supabase/schema.sql` in your Supabase SQL editor

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔍 How Does It Work?

### Food Detection Process

1. **User uploads a photo** → Image is converted to Base64 format
2. **Learned foods fetched** → Previous user corrections are retrieved
3. **Image sent to Gemini AI** → AI analyzes with enhanced prompt including learned data
4. **AI returns nutritional data** → Food names, portions, calories, macros
5. **Results displayed** → User can edit and adjust values
6. **Corrections saved** → Any edits improve future estimates

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│  Next.js    │────▶│  Gemini     │────▶│  Response   │
│  uploads    │     │  API Route  │     │  AI API     │     │  with food  │
│  photo      │     │ + learned   │     │ + enhanced  │     │  data       │
└─────────────┘     │  foods      │     │  prompt     │     └─────────────┘
                    └─────────────┘     └─────────────┘
                           ▲
                           │
                    ┌─────────────┐
                    │  Supabase   │
                    │  Database   │
                    │ (learned_   │
                    │  foods)     │
                    └─────────────┘
```

## 💾 Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts and settings |
| `food_logs` | Saved meals with nutritional data |
| `daily_summaries` | Daily calorie totals |
| `user_corrections` | When users edit AI estimates |
| `learned_foods` | Aggregated nutritional data from corrections |
| `user_feedback` | Thumbs up/down on accuracy |

### Learning Tables Detail

**`user_corrections`**
```sql
- food_name: "Chicken Biryani"
- original_calories: 350
- corrected_calories: 420
- original_protein: 15
- corrected_protein: 22
```

**`learned_foods`**
```sql
- food_name: "Chicken Biryani"
- avg_calories_per_100g: 385
- sample_count: 47
- confidence_score: 0.85
```

## 🔌 APIs Used

| API | Purpose | Endpoint |
|-----|---------|----------|
| **Google Gemini AI** | Analyze food images | `generativelanguage.googleapis.com` |
| **Supabase** | Database & Auth | `<your-project>.supabase.co` |

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (React) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **AI/ML** | Google Gemini 2.0 Flash |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Hosting** | Vercel |

## 📁 Project Structure

```
calories-plate/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts      # AI analysis endpoint
│   │   ├── corrections/route.ts  # Save user corrections
│   │   ├── feedback/route.ts     # Save accuracy feedback
│   │   ├── learned-foods/route.ts # Get learned data
│   │   └── logs/route.ts         # Meal logging
│   ├── page.tsx                  # Main page
│   ├── layout.tsx                # App layout
│   └── globals.css               # Global styles
├── components/
│   ├── ImageUpload.tsx           # Photo upload
│   ├── CalorieResults.tsx        # Results + learning UI
│   ├── AuthModal.tsx             # Sign in/up
│   ├── AuthProvider.tsx          # Auth context
│   └── DailyDashboard.tsx        # Daily tracking
├── lib/
│   └── supabase.ts               # Supabase client
├── types/
│   ├── index.ts                  # FoodItem types
│   └── database.ts               # Database types
├── supabase/
│   └── schema.sql                # Complete database schema
└── package.json
```

## 📝 Language Breakdown

| Language | Usage |
|----------|-------|
| **TypeScript** | ~90% (logic, components, API) |
| **SQL** | ~5% (database schema, triggers) |
| **CSS** | ~5% (Tailwind + globals) |

## 🔐 Security & Privacy

- **API Keys**: Stored as environment variables (not in code)
- **Images**: Processed in memory, not permanently stored
- **User Data**: Stored securely in Supabase with RLS policies
- **Row Level Security**: Users can only access their own data

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in project settings:
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Supabase Setup

1. Create a new Supabase project
2. Go to SQL Editor
3. Run the contents of `supabase/schema.sql`
4. Enable Email Auth in Authentication settings
5. Copy your project URL and anon key to `.env.local`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Ways to Contribute

- Improve AI prompts for better accuracy
- Add more cuisines to the reference data
- Enhance the learning algorithms
- Fix bugs or improve UX

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for the vision API
- [Supabase](https://supabase.com/) for database and auth
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vercel](https://vercel.com/) for hosting

---

**Note**: Calorie estimates are approximate and improve over time with user corrections. Not a substitute for professional dietary advice.
