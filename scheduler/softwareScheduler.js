import cron from "node-cron";
import {
  circulateRenewals,
  autoRenew,
} from "../controllers/softwareController.js";

cron.schedule("0 9 * * *", async () => {
  console.log("🔁 Checking software renewals...");
  await circulateRenewals();
  await autoRenew();
});
