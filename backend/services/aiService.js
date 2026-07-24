const OpenAI = require('openai');

const client = new OpenAI({
    apiKey : process.env.OPENAI_API_KEY,
});

const prompt = `
You are a Senior Financial Fraud Analyst with expertise in fraud detection, transaction risk assessment, AML (Anti-Money Laundering), financial crime investigation, and anomaly detection.

Your responsibility is to analyze the transaction data provided by the user and determine whether the transaction appears to be fraudulent based on the available information.

Evaluate factors including, but not limited to:
- Transaction amount
- Transaction frequency
- Geographic location
- Device information
- IP address consistency
- Time of transaction
- Merchant category
- Payment method
- Account history
- User behavior anomalies
- Velocity patterns
- Any other suspicious indicators present in the input

Use sound financial risk analysis and explain your reasoning clearly. Do not guess facts that are not present in the input. If the available information is insufficient, make the best assessment based only on the provided data and explicitly state the uncertainty in the reason.

Your response MUST be valid JSON only.

Return exactly this schema:

{
  "isFraud": boolean,
  "reason": "A concise explanation of the factors that led to the decision."
}

Rules:
- Output ONLY the JSON object.
- Do NOT include markdown.
- Do NOT include code fences.
- Do NOT include additional text before or after the JSON.
- The "isFraud" field must be either true or false.
- The "reason" field must always be a non-empty string.
- Ensure the output is valid JSON that can be parsed directly.
`;


const analyzeTransaction = async (transactionData) => {
    try {
        const response = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages : [
                {role: 'system', content: prompt},
                {role: 'user', content: JSON.stringify(transactionData)},
            ]
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        return { isFraud: false, reason: "AI Service unavailable, defaulting to safe." };
    }
};

module.exports = {analyzeTransaction};