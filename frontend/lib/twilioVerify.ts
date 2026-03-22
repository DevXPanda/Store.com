import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
const authToken = process.env.TWILIO_AUTH_TOKEN || "";
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || "";

function getClient() {
  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error(
      "Twilio Verify is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID."
    );
  }
  return { client: twilio(accountSid, authToken), verifyServiceSid };
}

export async function sendOtpSms(to: string) {
  const { client, verifyServiceSid } = getClient();
  return client.verify.v2.services(verifyServiceSid).verifications.create({
    to,
    channel: "sms",
  });
}

export async function checkOtpSms(to: string, code: string) {
  const { client, verifyServiceSid } = getClient();
  return client.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({ to, code });
}

export function isTwilioVerifyConfigured(): boolean {
  return !!(accountSid && authToken && verifyServiceSid);
}
