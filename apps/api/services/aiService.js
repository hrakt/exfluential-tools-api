async function generateAssetFromRequest(request) {
    // Mock response - simulates API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return a placeholder image URL
    const mockImageUrl = `https://via.placeholder.com/1200x630?text=${encodeURIComponent(request.primaryMessage || 'Marketing Asset')}`;

    return { assetUrl: mockImageUrl };
}

module.exports = { generateAssetFromRequest };
