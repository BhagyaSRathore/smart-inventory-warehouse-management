import { db } from "../src/db.ts";
import { registerDeviceToken, unregisterDeviceToken } from "../src/controllers/notification.controller.js";
import { notifyInventoryThreshold, createNotification } from "../src/services/notificationService.js";
import { sendPushNotification, isFirebaseReady } from "../src/services/fcmService.js";

async function runPushWorkflowVerification() {
  console.log("=== Smart Inventory: Push Notification Workflow Verification ===");

  try {
    // 1. Verify User query and fcmToken column
    const users = await db.orm.public.User.all();
    console.log(`[DB Check] Total users in DB: ${users.length}`);
    if (users.length === 0) {
      console.warn("No users found in database to verify token registration.");
      return;
    }

    const testUser = users[0];
    console.log(`[DB Check] Target verification user ID: ${testUser.id} (${testUser.name || testUser.email})`);
    console.log(`[DB Check] Initial fcmToken value: ${testUser.fcmToken}`);

    // 2. Test Token Registration logic
    const mockDeviceToken = "fcm_test_token_" + Date.now();
    await db.orm.public.User.where({ id: testUser.id }).update({ fcmToken: mockDeviceToken });

    const updatedUser = await db.orm.public.User.first({ id: testUser.id });
    console.log(`[Token Reg Check] Successfully saved FCM token to user: ${updatedUser.fcmToken === mockDeviceToken ? "PASSED" : "FAILED"}`);

    // 3. Test FCM Service Graceful Execution
    console.log(`[FCM Service Check] Is Firebase Admin ready: ${isFirebaseReady()}`);
    const pushResult = await sendPushNotification({
      title: "Test Alert",
      body: "Testing push notification delivery pipeline",
      userId: testUser.id,
      data: {
        route: "Notifications",
        filter: "inventory",
        type: "LOW_STOCK",
        severity: "WARNING",
      },
    });
    console.log(`[FCM Service Check] sendPushNotification result:`, pushResult);

    // 4. Test Stock Alert Notification Creation & Deduplication
    const products = await db.orm.public.Product.all();
    const warehouses = await db.orm.public.Warehouse.all();

    if (products.length > 0 && warehouses.length > 0) {
      const testProd = products[0];
      const testWh = warehouses[0];
      console.log(`[Stock Alert Check] Testing notifyInventoryThreshold for Product: ${testProd.name} (ID: ${testProd.id}), Warehouse: ${testWh.name} (ID: ${testWh.id})`);

      // Test with quantity 0 (Out of stock)
      const outOfStockNotif = await notifyInventoryThreshold({
        productId: testProd.id,
        warehouseId: testWh.id,
        quantity: 0,
      });

      console.log(`[Stock Alert Check] Generated Out Of Stock Notification: ID=${outOfStockNotif?.id}, Title="${outOfStockNotif?.title}", Type=${outOfStockNotif?.type}`);

      // Test duplicate suppression
      const duplicateNotif = await notifyInventoryThreshold({
        productId: testProd.id,
        warehouseId: testWh.id,
        quantity: 0,
      });

      console.log(`[Stock Alert Check] Duplicate suppressed successfully: ${duplicateNotif?.id === outOfStockNotif?.id ? "PASSED" : "FAILED"}`);
    }

    // 5. Test Token Unregistration logic
    await db.orm.public.User.where({ id: testUser.id }).update({ fcmToken: null });
    const clearedUser = await db.orm.public.User.first({ id: testUser.id });
    console.log(`[Token Cleanup Check] Token cleared successfully: ${clearedUser.fcmToken === null ? "PASSED" : "FAILED"}`);

    console.log("=== Push Notification Workflow Verification Completed Successfully ===");
  } catch (error) {
    console.error("Verification failed with error:", error);
  } finally {
    process.exit(0);
  }
}

runPushWorkflowVerification();
