import axios from 'axios';

const GRAPH_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v26.0';

export const sendWhatsAppMessage = async (
recipient: string,
message: string
): Promise<void> => {
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

if (!accessToken || !phoneNumberId) {
throw new Error('WhatsApp API credentials are not configured.');
}

await axios.post(
`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
{
messaging_product: 'whatsapp',
recipient_type: 'individual',
to: recipient,
type: 'text',
text: { body: message },
},
{
headers: {
Authorization: `Bearer ${accessToken}`,
'Content-Type': 'application/json',
},
timeout: Number(process.env.WHATSAPP_TIMEOUT_SECONDS || 10) * 1000,
}
);
};
