import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import fs from "fs";
import { db } from "../db.ts";

let isFirebaseInitialized = false;

/**
 * Gracefully initialize the Firebase Admin SDK.
 * Supports:
 *  - Service account JSON path (FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS)
 *  - Raw JSON string in FIREBASE_SERVICE_ACCOUNT_KEY
 *  - Individual env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 *  - Application default credentials
 */
function initFirebaseAdmin() {
  if (getApps().length > 0) {
    isFirebaseInitialized = true;
    return;
  }

  try {
    const credPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (credPath && fs.existsSync(credPath)) {
      const fileData = fs.readFileSync(credPath, "utf8");
      const serviceAccount = JSON.parse(fileData);
      initializeApp({
        credential: cert(serviceAccount),
      });
      isFirebaseInitialized = true;
      console.log("[FCM] Firebase Admin initialized from service account file.");
      return;
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount),
      });
      isFirebaseInitialized = true;
      console.log("[FCM] Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_KEY.");
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
      isFirebaseInitialized = true;
      console.log("[FCM] Firebase Admin initialized from individual env variables.");
      return;
    }

    // Attempt application default credentials if available
    try {
      initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || "smart-inventory-34026",
      });
      isFirebaseInitialized = true;
      console.log("[FCM] Firebase Admin initialized via application default credentials.");
      return;
    } catch {
      // Ignored - fall through to defensive warning
    }

    console.warn(
      "[FCM] Firebase Admin credentials not configured. Push notifications will run in safe mock/dry-run mode without crashing."
    );
  } catch (err) {
    console.error("[FCM] Failed to initialize Firebase Admin SDK:", err.message);
    isFirebaseInitialized = false;
  }
}

// Initialize on module load
initFirebaseAdmin();

/**
 * Sanitize all data payload values to strings (FCM requires string key-value pairs).
 */
function sanitizeDataPayload(data = {}) {
  const sanitized = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && val !== null) {
      sanitized[key] = String(val);
    }
  }
  return sanitized;
}

/**
 * Remove invalid or unregistered tokens from the user database.
 */
async function cleanupInvalidTokens(invalidTokens) {
  if (!invalidTokens || invalidTokens.length === 0) return;
  for (const token of invalidTokens) {
    try {
      await db.orm.public.User.where({ fcmToken: token }).update({ fcmToken: null });
      console.log(`[FCM] Cleared unregistered/invalid token from database: ${token.substring(0, 15)}...`);
    } catch (err) {
      console.error("[FCM] Error clearing invalid token:", err.message);
    }
  }
}

/**
 * Send push notification to target user(s) or broadcast to all users with active tokens.
 *
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body/message
 * @param {Object} [options.data] - Additional payload for routing & details
 * @param {number|string|null} [options.userId] - Specific user ID, or null to broadcast
 */
export async function sendPushNotification({
  title,
  body,
  data = {},
  userId = null,
}) {
  if (!isFirebaseInitialized) {
    console.log(`[FCM Safe Mode] Notification: "${title}" - "${body}" (UserId: ${userId ?? "broadcast"})`);
    return {
      success: true,
      delivered: false,
      reason: "Firebase Admin not initialized (Mock/Dry-Run)",
      dryRun: true,
    };
  }

  try {
    let tokens = [];

    if (userId !== null && userId !== undefined) {
      const user = await db.orm.public.User.first({ id: Number(userId) });
      if (user && user.fcmToken) {
        tokens.push(user.fcmToken);
      }
    } else {
      // Broadcast to all users who have an FCM token registered
      const allUsers = await db.orm.public.User.all();
      tokens = allUsers
        .map((u) => u.fcmToken)
        .filter((tok) => Boolean(tok && typeof tok === "string" && tok.trim().length > 0));
    }

    // Deduplicate tokens
    tokens = Array.from(new Set(tokens));

    if (tokens.length === 0) {
      console.log(`[FCM] No registered device tokens found for target (userId: ${userId ?? "broadcast"}).`);
      return { success: true, sentCount: 0, message: "No active device tokens found" };
    }

    const stringData = sanitizeDataPayload(data);

    const message = {
      tokens,
      notification: {
        title: String(title || "Smart Inventory Alert"),
        body: String(body || ""),
      },
      data: stringData,
      android: {
        priority: "high",
        notification: {
          channelId: "smart_inventory_channel",
          sound: "default",
          priority: "high",
        },
      },
    };

    const messaging = getMessaging();
    const response = await messaging.sendEachForMulticast(message);
    console.log(
      `[FCM] Multicast notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`
    );

    const invalidTokens = [];
    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        const errCode = resp.error?.code;
        console.warn(`[FCM] Token delivery failure (${tokens[index].substring(0, 15)}...):`, errCode, resp.error?.message);
        if (
          errCode === "messaging/registration-token-not-registered" ||
          errCode === "messaging/invalid-registration-token" ||
          errCode === "messaging/invalid-argument"
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await cleanupInvalidTokens(invalidTokens);
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error("[FCM] Error sending push notification:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check whether Firebase Admin is currently active and initialized.
 */
export function isFirebaseReady() {
  return isFirebaseInitialized;
}
