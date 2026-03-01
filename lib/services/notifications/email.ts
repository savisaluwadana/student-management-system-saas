export async function sendEmail({
    to,
    subject,
    message,
}: {
    to: string;
    subject: string;
    message: string;
}): Promise<{ success: boolean; error?: string }> {
    // TODO: Actual integration with Resend, SendGrid, etc.
    console.log(`[EMAIL Service] Sending to: ${to}, Subject: ${subject}`);
    console.log(`[EMAIL Service] Message: ${message}`);

    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true };
}
