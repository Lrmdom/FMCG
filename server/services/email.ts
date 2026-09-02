// Nota: Como o Resend não está no package.json, simularemos o envio.
// Em ambiente real, instalar: npm install resend
// TODO: Implement real Resend API integration

export const EmailService = {
  send: async (data: { to: string; subject: string; html: string }) => {
    // Mock para testar fluxo
    console.log(`[EmailService] Simulando envio de e-mail para ${data.to}: ${data.subject}`);
    return { id: 'email-mock-123' };
  }
};
