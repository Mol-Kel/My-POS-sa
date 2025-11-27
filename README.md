# SA POS MVP - South African Point of Sale System
- Version: 1.0.0
- Platform: Android & iOS (React Native)
- Status: Currently in Development

## What Is This?
SA POS is a mobile point-of-sale system designed specifically for South African small businesses:

- Fast-food stands (kota stands, bunny chow vendors)
- Spaza shops (neighborhood grocery stores)

The app works 100% offline and syncs automatically when internet is available.

### Key Features
#### Dual Business Modes

1. Fast-food Mode: Quick sales, menu items, no stock tracking
2. Spaza Mode: Full inventory management with barcode scanning

#### Offline-First Design

- Works completely without internet
- All sales and data saved locally
- Auto-syncs when connection returns
- Never lose a sale due to network issues

### Core Capabilities

- ✅ Add and manage items/products
- ✅ Quick sale processing (1-2 taps)
- ✅ Daily sales totals and analytics
- ✅ Sales history with receipts
- ✅ Stock management (Spaza mode)
- ✅ Barcode scanning (Spaza mode)
- ✅ Low-stock alerts
- ✅ CSV export for accounting
- ✅ Multi-device sync


### Technical Architecture
#### Tech Stack
- Frontend:  React Native (Expo)
- Local DB:  SQLite (offline storage)
- Cloud:     Supabase (PostgreSQL)
- Sync:      Custom operation-log protocol

#### How It Works
- Everything happens locally first → Saved to SQLite instantly
- Operations are logged → Every change tracked in sync queue
- Auto-sync when online → Uploads changes to cloud
- Conflict-free → Append-only design prevents data conflicts
- Multi-device ready → Changes sync across all devices


# No private api and anon KEYs are displayed. Placeholders are used
