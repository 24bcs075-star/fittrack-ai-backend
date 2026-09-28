const { GoogleGenAI } = require('@google/genai');

/**
 * Lazily initializes the Gemini client.
 * Returns null if GEMINI_API_KEY is not configured.
 * This prevents the server from crashing at startup when the key is absent.
 */
let _client = null;

const getClient = () => {
  if (_client) return _client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  _client = new GoogleGenAI({ apiKey: apiKey.trim() });
  return _client;
};

/**
 * Checks that the Gemini client is ready.
 * Throws a clean, user-facing error if the API key is missing.
 */
const requireClient = () => {
  const client = getClient();
  if (!client) {
    const err = new Error('Gemini API is not configured. Please set GEMINI_API_KEY in your .env file.');
    err.statusCode = 503;
    throw err;
  }
  return client;
};

const getModel = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Determines whether a Gemini API error is a transient failure that should be retried.
 * Retries on: 503 UNAVAILABLE (high demand) and 429 RESOURCE_EXHAUSTED (rate limit).
 */
const isRetryableError = (error) => {
  const msg = error.message || '';
  const status = error.status;
  return (
    status === 503 ||
    status === 429 ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('high demand') ||
    msg.includes('rate limit') ||
    msg.includes('quota')
  );
};

/**
 * Calls an async function with up to maxAttempts retries on transient errors.
 * Uses exponential backoff: 1s, 2s, 4s between attempts.
 */
const callWithRetry = async (fn, maxAttempts = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (error.statusCode === 503 && error.message && error.message.includes('not configured')) {
        throw error;
      }
      if (attempt < maxAttempts && isRetryableError(error)) {
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.warn(`Gemini transient error (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`);
        console.warn('  reason:', (error.message || '').slice(0, 200));
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
};

/**
 * Generates a personalized workout recommendation using Google Gemini.
 */
const generateWorkoutRecommendation = async (age, fitnessGoal, experienceLevel) => {
  const client = requireClient();
  const prompt = `You are a certified fitness assistant. Provide a personalized, practical workout plan based on the following user profile:

- Age: ${age}
- Fitness Goal: ${fitnessGoal}
- Experience Level: ${experienceLevel}

Guidelines:
- Provide general fitness guidance only. Do NOT diagnose medical conditions or prescribe medical treatment.
- Structure your response as a clear, actionable weekly workout plan.
- Include: recommended exercise types, frequency per week, duration per session, intensity guidance, and one motivational tip.
- Keep the response concise and direct (3-4 paragraphs). No markdown stars or bullet symbols.
- Tailor advice appropriately for a ${experienceLevel} level athlete.`;

  try {
    const response = await callWithRetry(() =>
      client.models.generateContent({ model: getModel(), contents: prompt })
    );
    const text = response.text ? response.text.trim() : null;
    if (!text) throw new Error('Gemini returned an empty response for workout recommendation.');
    return text;
  } catch (error) {
    if (error.statusCode === 503 && error.message && error.message.includes('not configured')) throw error;
    console.error('Gemini Recommendation Error:');
    console.error('  message   :', error.message);
    console.error('  status    :', error.status ?? error.code ?? 'n/a');
    console.error('  details   :', JSON.stringify(error.errorDetails ?? error.details ?? null));
    if (process.env.NODE_ENV !== 'production') console.error('  stack     :', error.stack);
    const err = new Error('Failed to generate workout recommendation. Please try again later.');
    err.statusCode = 502;
    throw err;
  }
};

/**
 * Generates personalized fitness insights using Google Gemini.
 */
const generateFitnessInsights = async (totalWorkouts, averageWorkoutDuration, totalCaloriesBurned) => {
  const client = requireClient();
  const prompt = `You are a certified fitness assistant. Analyze this user's fitness progress and provide personalized insights:

- Total Workouts Logged: ${totalWorkouts}
- Average Workout Duration: ${averageWorkoutDuration} minutes
- Total Calories Burned: ${totalCaloriesBurned} kcal

Guidelines:
- Provide general fitness guidance only. Do NOT diagnose medical conditions or prescribe medical treatment.
- Analyze the current performance level, highlight what is going well, and suggest 2-3 actionable improvements.
- Include a brief motivational message.
- Keep the response concise and direct (2-3 paragraphs). No markdown stars or bullet symbols.
- Avoid unsafe or extreme exercise recommendations.`;

  try {
    const response = await callWithRetry(() =>
      client.models.generateContent({ model: getModel(), contents: prompt })
    );
    const text = response.text ? response.text.trim() : null;
    if (!text) throw new Error('Gemini returned an empty response for fitness insights.');
    return text;
  } catch (error) {
    if (error.statusCode === 503 && error.message && error.message.includes('not configured')) throw error;
    console.error('Gemini Insights Error:');
    console.error('  message   :', error.message);
    console.error('  status    :', error.status ?? error.code ?? 'n/a');
    console.error('  details   :', JSON.stringify(error.errorDetails ?? error.details ?? null));
    if (process.env.NODE_ENV !== 'production') console.error('  stack     :', error.stack);
    const err = new Error('Failed to generate fitness insights. Please try again later.');
    err.statusCode = 502;
    throw err;
  }
};

module.exports = {
  generateWorkoutRecommendation,
  generateFitnessInsights,
};
