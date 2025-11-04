// utils/sendEmail.js
import "isomorphic-fetch";
import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import dotenv from "dotenv";

dotenv.config();

// Azure AD authentication
const credential = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID,
  process.env.AZURE_CLIENT_ID,
  process.env.AZURE_CLIENT_SECRET
);

// Initialize Graph client
const client = Client.initWithMiddleware({
  authProvider: {
    getAccessToken: async () => {
      const token = await credential.getToken(
        "https://graph.microsoft.com/.default"
      );
      return token.token;
    },
  },
});

// Send email via Microsoft Graph API
export const sendEmail = async ({ to, cc, subject, html }) => {
  try {
    const message = {
      subject,
      body: {
        contentType: "HTML",
        content: html,
      },
      toRecipients: [{ emailAddress: { address: to } }],
    };

    if (cc) {
      message.ccRecipients = [{ emailAddress: { address: cc } }];
    }

    await client
      .api(`/users/${process.env.SENDER_EMAIL}/sendMail`)
      .post({ message });

    console.log(`📧 Email successfully sent to ${to}`);
  } catch (err) {
    console.error("❌ Email send failed:", err.response?.data || err.message);
  }
};
