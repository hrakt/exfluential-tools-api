async function generateAssetFromRequest(request) {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
        throw new Error("Missing DASHSCOPE_API_KEY in environment variables.");
    }

    const promptText = `Professional dental practice image. A confident dentist and smiling patient in a modern, clean dental clinic. ` +
        `European or American ethnicities. Clinical, welcoming atmosphere with bright lighting. ` +
        `Large, bold, readable headline text displayed prominently at the top of the image. ` +
        `High quality, professional photography style. ${request.primaryMessage || ""}`.trim();
    const payload = {
        model: "qwen-image-max",
        input: {
            messages: [
                {
                    role: "user",
                    content: [{ text: promptText }]
                }
            ]
        }
    };

    const response = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const imageUrl = data?.output?.choices?.[0]?.message?.content?.[0]?.image;

    if (!imageUrl) {
        throw new Error(`No image URL in response: ${JSON.stringify(data)}`);
    }

    return { assetUrl: imageUrl };
}

module.exports = { generateAssetFromRequest };
