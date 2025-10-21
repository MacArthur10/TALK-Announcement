// utils/generateOrderSlug.ts

export function generateOrderSlug(): string {
    // Get current date as YYYYMMDD (e.g., 20250619)
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Generate a random alphanumeric string of length 6
    const randomPart = Math.random().toString(36).substring(2, 8);

    // Combine into a slug like: "order-20250619-4f3a9c"
    return `order-${datePart}-${randomPart}`;
}
