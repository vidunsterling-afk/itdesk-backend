import fetch from "node-fetch";
import M365Usage from "../models/m365Usage.model.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

/** 🔐 Get Access Token */
async function getAccessToken() {
  const url = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    client_id: process.env.AZURE_CLIENT_ID,
    client_secret: process.env.AZURE_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(url, { method: "POST", body: params });
  if (!res.ok) throw new Error(`Token request failed: ${res.statusText}`);
  const data = await res.json();
  return data.access_token;
}

/** 🧠 Parse CSV into JSON */
function parseCsv(csv) {
  const [header, ...rows] = csv.trim().split("\n");
  const keys = header.split(",").map((k) => k.trim());
  return rows.map((row) => {
    const values = row.split(",").map((v) => v.trim());
    const obj = {};
    keys.forEach((k, i) => (obj[k] = values[i] || ""));
    return obj;
  });
}

/** 🔄 Update Microsoft 365 Usage Data */
export async function updateM365Usage() {
  try {
    const token = await getAccessToken();

    // 1️⃣ Mailbox usage
    const mailRes = await fetch(
      `${GRAPH_BASE}/reports/getMailboxUsageDetail(period='D7')`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!mailRes.ok)
      throw new Error(`Mailbox fetch failed: ${mailRes.statusText}`);
    const mailCsv = await mailRes.text();

    // 2️⃣ OneDrive usage
    const driveRes = await fetch(
      `${GRAPH_BASE}/reports/getOneDriveUsageAccountDetail(period='D7')`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!driveRes.ok)
      throw new Error(`OneDrive fetch failed: ${driveRes.statusText}`);
    const driveCsv = await driveRes.text();

    const mailData = parseCsv(mailCsv);
    const driveData = parseCsv(driveCsv);

    // Merge and save
    for (const user of mailData) {
      const userEmail = (user["User Principal Name"] || "")
        .trim()
        .toLowerCase();
      const drive = driveData.find(
        (d) =>
          (d["Owner Principal Name"] || "").trim().toLowerCase() === userEmail
      );

      await M365Usage.findOneAndUpdate(
        { userPrincipalName: userEmail },
        {
          displayName: user["Display Name"] || "",
          mailboxUsedMB:
            parseFloat(user["Storage Used (Byte)"] || 0) / (1024 * 1024),
          mailboxQuotaMB:
            parseFloat(user["Issue Warning Quota (Byte)"] || 0) / (1024 * 1024),
          onedriveUsedMB:
            parseFloat(drive?.["Storage Used (Byte)"] || 0) / (1024 * 1024),
          onedriveTotalMB:
            parseFloat(drive?.["Storage Allocated (Byte)"] || 0) /
            (1024 * 1024),
          lastActivityDate: user["Last Activity Date"] || null,
          reportDate: new Date(),
        },
        { upsert: true }
      );
    }

    console.log("✅ M365 usage data updated successfully.");
  } catch (err) {
    console.error("❌ M365 sync failed:", err.message);
  }
}
