export async function sendWhatsApp({
    to,
    message,
}: {
    to: string;
    message: string;
}): Promise<{ success: boolean; error?: string }> {
    // TODO: Actual integration with WhatsApp Business API
    console.log(`[WhatsApp Service] Sending to: ${to}`);
    console.log(`[WhatsApp Service] Message: ${message}`);

    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true };
}
