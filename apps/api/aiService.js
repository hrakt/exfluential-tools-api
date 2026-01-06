
// This service simulates calling a Google AI / Gemini API.
// In a real implementation, you would use the @google/generative-ai SDK.

async function generateAssetFromRequest(request) {
    console.log(`[AI Service] Generating asset for request ${request.id}...`);

    // Construct the prompt as specified
    const prompt = `Create a marketing asset for a ${request.channel} campaign for a healthcare practice named ${request.practiceName}, led by Dr. ${request.doctorName}. The primary message is: ${request.primaryMessage}. The practice type is ${request.practiceType}.`;

    console.log(`[AI Service] Prompt: "${prompt}"`);

    // Simulate network delay (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For now, return a dummy asset URL or text based on the request
    // If it's a "social" channel, maybe pretend it's an image. Otherwise text.
    const isImage = request.channel === 'social' || request.channel === 'poster';
    
    if (isImage) {
        return `https://via.placeholder.com/600x400?text=Campaign+for+${encodeURIComponent(request.practiceName)}`;
    } else {
        return `Generated copy for ${request.channel}: "Discover excellence at ${request.practiceName} with Dr. ${request.doctorName}. ${request.primaryMessage}"`;
    }
}

module.exports = {
    generateAssetFromRequest
};
