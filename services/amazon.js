export async function callAmazonUpdateBudget(params) {

    await new Promise(r => setTimeout(r, 30 + Math.random() * 70));
    const roll = Math.random();
    if (roll < 0.15) return { status: 429 };
    if (roll < 0.25) return { status: 500 };
    return { status: 200 };
};