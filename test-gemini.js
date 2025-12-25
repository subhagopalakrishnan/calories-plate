// Simple script to test Google Gemini API key
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiKey() {
  // Get API key from environment variable or command line argument
  const apiKey = process.env.GEMINI_API_KEY || process.argv[2];
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('❌ Error: Gemini API key not found!');
    console.log('\nUsage:');
    console.log('  GEMINI_API_KEY=your_key_here node test-gemini.js');
    console.log('  OR');
    console.log('  node test-gemini.js your_key_here');
    console.log('\nGet a free API key at: https://makersuite.google.com/app/apikey');
    process.exit(1);
  }

  console.log('🔑 Testing Google Gemini API key...\n');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Make a simple API call to test the key
    const result = await model.generateContent('Say "API key is working!" if you can read this.');
    const response = await result.response;
    const message = response.text();
    
    if (message) {
      console.log('✅ SUCCESS! Your Gemini API key is working!');
      console.log(`📝 Response: ${message}\n`);
      console.log('You can now use this API key in your .env.local file.');
      console.log('✨ Gemini API has a generous free tier - enjoy!');
    } else {
      console.log('⚠️  API call succeeded but no message received.');
    }
  } catch (error) {
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401')) {
      console.error('❌ ERROR: Invalid API key!');
      console.error('   Please check that your API key is correct.');
      console.error('   Get a free key at: https://makersuite.google.com/app/apikey');
    } else if (error.message?.includes('429') || error.message?.includes('quota')) {
      console.error('❌ ERROR: Rate limit exceeded or quota exceeded.');
      console.error('   Please check your Google Cloud account.');
    } else {
      console.error('❌ ERROR:', error.message);
    }
    process.exit(1);
  }
}

testGeminiKey();

