const { GoogleGenerativeAI } = require("@google/generative-ai");

async function generateAssetFromRequest(request) {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    
    if (!apiKey) {
        console.error("[AI Service] Error: GOOGLE_GENAI_API_KEY is not set.");
        return `[Simulation Mode] Marketing asset for ${request.practiceName}: "Visit Dr. ${request.doctorName} for the best ${request.practiceType} services! ${request.primaryMessage}"`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // Using 'gemini-1.5-flash-latest' which is often more reliable than the base name
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        console.log(`[AI Service] Calling Gemini (1.5-flash-latest) for request ${request.id}...`);

        const prompt = `
            You are a professional marketing copywriter. 
            Create a short, catchy marketing asset for a ${request.channel} campaign.
            
            Context:
            - Practice Name: ${request.practiceName}
            - Doctor: Dr. ${request.doctorName}
            - Practice Type: ${request.practiceType}
            - Primary Message: ${request.primaryMessage}
            
            Format:
            If 'social' or 'poster': [HEADLINE], [BODY COPY], [VISUAL SUGGESTION].
            If 'email': [SUBJECT LINE], [EMAIL BODY].
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("[AI Service] Error calling Google AI:", error);
        
        // If 1.5-flash fails again, we might want to try gemini-2.0-flash-001 from your snippets
        throw new Error(`AI Generation failed: ${error.message}`);
    }
}

module.exports = {
    generateAssetFromRequest
};
