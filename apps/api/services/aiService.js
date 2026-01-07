const { exec } = require('child_process');

async function generateAssetFromRequest(request) {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
        throw new Error("Missing DASHSCOPE_API_KEY in environment variables.");
    }

    const promptText = `An image of a doctor with patient and a dental practice, featuring European or American looking people, ` +
        `with a readable headline text at the top of the image. ${request.primaryMessage || ""}`.trim();
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

    const curlCmd = `curl --location 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation' ` +
        `--header 'Content-Type: application/json' ` +
        `--header "Authorization: Bearer ${apiKey}" ` +
        `--data '${JSON.stringify(payload)}'`;

    const stdout = await new Promise((resolve, reject) => {
        exec(curlCmd, (err, stdout) => {
            if (err) reject(err);
            else resolve(stdout);
        });
    });

    let response;
    try {
        response = JSON.parse(stdout);
    } catch (err) {
        throw new Error(`Invalid JSON response: ${stdout}`);
    }

    const imageUrl = response?.output?.choices?.[0]?.message?.content?.[0]?.image;
    if (!imageUrl) {
        throw new Error(`No image URL in response: ${stdout}`);
    }

    return imageUrl;
}

module.exports = { generateAssetFromRequest };
