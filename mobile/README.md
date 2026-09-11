# Mobile Application

## Overview

React Native mobile application for warehouse workers to perform inventory operations using barcode/QR scanning.

## Technology Stack (Planned)

- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation
- **Expo Camera** - Barcode/QR scanning
- **AsyncStorage** - Local storage
- **Axios** - API communication

## Features (Planned)

### Core Features
- 📱 Barcode/QR code scanning
- 📦 Stock in operations
- 📤 Stock out operations
- 🔄 Stock transfer between locations
- 🔍 Product search
- 📊 Real-time inventory status
- 🔔 Push notifications
- 📴 Offline mode support

### User Roles
- Warehouse Manager
- Warehouse Worker
- Inventory Controller

## Screens (Planned)

1. **Login Screen**
   - User authentication
   - Remember me option

2. **Dashboard**
   - Quick actions
   - Pending tasks
   - Today's summary

3. **Scanner**
   - Camera view
   - Barcode/QR detection
   - Product identification

4. **Stock Operations**
   - Stock in form
   - Stock out form
   - Transfer form
   - Quantity input
   - Location selection

5. **Product Details**
   - Product information
   - Current stock
   - Location
   - Recent movements

6. **History**
   - Recent scans
   - Stock movements
   - Filter by date

7. **Settings**
   - Profile
   - Logout
   - App preferences

## Workflow Example

```
Scan Barcode 
    ↓
Identify Product
    ↓
Select Operation (Stock In/Out/Transfer)
    ↓
Enter Quantity
    ↓
Select Location/Warehouse/Rack
    ↓
Confirm Operation
    ↓
Sync with Backend
    ↓
Show Success/Error
```

## Offline Support

- Local queue for operations
- Sync when connection restored
- Visual indicator for sync status

## Setup Instructions (When Implemented)

1. Install dependencies
   ```bash
   npm install
   ```

2. Start Expo
   ```bash
   npx expo start
   ```

3. Run on device
   - Scan QR code with Expo Go app
   - Or use Android/iOS simulator

## Status

🔄 **Not yet implemented** - This will be Phase 5 of development
