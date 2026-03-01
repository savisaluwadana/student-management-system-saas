export async function sendSms({
    to,
    message,
}: {
    to: string;
    message: string;
}): Promise<{ success: boolean; error?: string }> {
    // TODO: Actual integration with Twilio, AWS SNS, etc.
    console.log(`[SMS Service] Sending to: ${to}`);
    console.log(`[SMS Service] Message: ${message}`);

    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true };
}
