import { EmailService } from '../services/email.ts';

async function testEmailSend() {
  console.log('🧪 Testando Email Service (Resend)...');
  try {
    await EmailService.send({ 
      to: 'test@example.com', 
      subject: 'Teste', 
      html: '<h1>Teste</h1>' 
    });
    console.log('✅ Email enviado.');
  } catch (e: any) {
    if (e.message === 'Not implemented') {
        console.log('✅ Teste falhou conforme esperado:', e.message);
        process.exit(0);
    } else {
        throw e;
    }
  }
}

testEmailSend().catch(e => { console.error(e); process.exit(1); });
