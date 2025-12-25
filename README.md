# Calories Plate - Food Calorie Calculator

A modern web application that uses AI to analyze food images and automatically calculate calories and nutritional information.

## Features

- 📸 **Image Upload**: Upload or take a photo of your food
- 🤖 **AI-Powered Recognition**: Uses Google Gemini API (FREE tier!) to identify food items
- 📊 **Nutritional Analysis**: Automatic calorie, protein, carbs, and fat calculations
- 🎨 **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- 💰 **Free to Use**: Powered by Google Gemini's generous free tier

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Google Gemini API key (FREE - get one at [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

   Get your free API key at: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. **Image Capture**: Users can upload an image or take a photo using their device camera
2. **AI Analysis**: The image is sent to Google Gemini's vision model to identify food items
3. **Calorie Calculation**: The app matches identified foods against a nutritional database and calculates calories based on estimated quantities
4. **Results Display**: Nutritional information is displayed in an easy-to-read format

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Gemini API** - Free vision model for food recognition (gemini-1.5-flash)
- **Food Database** - Built-in nutritional database for common foods

## API Endpoints

- `POST /api/analyze` - Analyzes an uploaded food image and returns nutritional information

## Notes

- The app uses a built-in food database for calorie calculations. For production use, consider integrating with a comprehensive nutritional database API like USDA FoodData Central or Edamam.
- Quantity estimation is approximate. For more accurate results, users could manually adjust quantities.
- **Google Gemini API is FREE** with generous rate limits! No credit card required for the free tier.
- You can test your API key using: `node test-gemini.js your_api_key_here`

## Deployment

### Deploy to Vercel

The easiest way to deploy is using Vercel:

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variable `GEMINI_API_KEY` in Vercel project settings
4. Deploy!

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/calories-plate)

## License

MIT

