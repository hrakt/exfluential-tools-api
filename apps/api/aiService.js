async function generateAssetFromRequest(request) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return simulated marketing asset based on channel type
    if (request.channel === 'email') {
        return `SUBJECT LINE: Transform Your Health at ${request.practiceName}

EMAIL BODY:
Dear Friend,

Experience exceptional ${request.practiceType} care under the expert guidance of Dr. ${request.doctorName}.

${request.primaryMessage}

At ${request.practiceName}, we're committed to your wellness journey.

Schedule your consultation today!

Best regards,
${request.practiceName} Team`;
    } else if (request.channel === 'social' || request.channel === 'poster') {
        return `HEADLINE: Your Health, Our Priority - ${request.practiceName}

BODY COPY: Discover premium ${request.practiceType} care with Dr. ${request.doctorName}. ${request.primaryMessage} Join hundreds of satisfied patients!

VISUAL SUGGESTION: Use a professional medical setting background with warm, welcoming colors. Include imagery of Dr. ${request.doctorName} in a clinical environment and happy patients. Add your practice logo prominently.`;
    } else {
        return `Marketing Asset for ${request.channel} Channel:

Practice: ${request.practiceName}
Doctor: Dr. ${request.doctorName}
Type: ${request.practiceType}
Message: ${request.primaryMessage}

This is a simulated marketing asset. Customize based on your campaign needs.`;
    }
}

module.exports = {
    generateAssetFromRequest
};
