# Security Specification & "Dirty Dozen" Threat Model

This document outlines the security architecture, absolute datastore invariants, and verification scenarios to protect the Homemade Food Ordering system from unauthorized actions.

---

## 1. Core Data Invariants

1. **Public Read-Only Assets**: `categories` and `menuItems` can be read by anyone (publicly accessible). Only authenticated and authorized administrative roles (`super_admin` or `operator` with specific permissions) can write, edit, or soft-delete them.
2. **Secure Order Submission**: Any public customer can create an order. However, the order document's `status` must always start as `'Pending'` (users cannot self-approve or fast-play orders).
3. **No General Order Scraping**: Public users can *never* retrieve a list of all orders (`list` query is blocked). They can only fetch a single order (`get`) if they possess the exact, cryptographically randomized 20+ character unique `orderId`.
4. **Administrative Access Lockdown**: To modify menu items, edit custom categories, change site settings, or manage/delete orders, the user must be authenticated, and their Google Auth UID must correspond to a valid active administrative profile in `/admins/{adminId}` with the necessary permission tags.
5. **Role Modification Safety**: A standard operator is forbidden from modifying administrative accounts, altering permissions, or promoting themselves to standard/super administrative roles. This is strictly reserved for the single bootstrapped `super_admin` root account.
6. **Immutable Transaction Tracking**: Once created, historical `orderId`, `invoiceNumber`, `totalPrice`, and `createdAt` are locked (cannot be altered). Orders cannot be permanently deleted by general actors (soft-delete indicator only, handled via admin logging).
7. **System Audit Trail**: Activity logs (`activityLogs`) are write-once, append-only records. No actor, operator, or admin can edit or remove a log entry once it is written.

---

## 2. The "Dirty Dozen" Threat Vector Payloads

Below are the 12 specific payloads or actions designed to pierce standard validation and how our Zero-Trust rules securely reject them (`PERMISSION_DENIED`).

### Attack Vector 1: Self-Registered Administrator Role
* **Description**: A malicious customer attempts to insert a record into the `/admins` collection to grant themselves `super_admin` access.
* **Payload**:
  ```json
  // POST /admins/attacker_uid
  {
    "uid": "attacker_uid",
    "email": "attacker@gmail.com",
    "role": "super_admin",
    "permissions": ["all"],
    "isDeleted": false
  }
  ```
* **Result**: **REJECTED**. Only an existing authenticated `super_admin` can write to the `/admins` collection.

### Attack Vector 2: Menu Pricing Poisoning
* **Description**: A user attempts to change the price of the "Homemade Beef Kacchi" to 1 BDT.
* **Payload**:
  ```json
  // PATCH /menuItems/beef_kacchi_123
  {
    "regularPrice": 1.00,
    "discountedPrice": 0.50
  }
  ```
* **Result**: **REJECTED**. Write operations on `/menuItems` are restricted solely to users verified as admins/operators with `manage_menu` permissions.

### Attack Vector 3: Self-Approving Order Status
* **Description**: A customer creates an order and initializes its status to `'Delivered'` or `'Accepted'` without making the required delivery payment.
* **Payload**:
  ```json
  // POST /orders/rand-order-uuid
  {
    "id": "rand-order-uuid",
    "fullName": "Imposter User",
    "phoneNumber": "01700000000",
    "fullAddress": "Dhaka, Bangladesh",
    "items": [{ "menuItemId": "biryani", "quantity": 1 }],
    "totalPrice": 450,
    "deliveryCharge": 60,
    "paymentMethod": "Cash on Delivery",
    "bKashNumber": "01700000000",
    "transactionId": "BKX124578",
    "status": "Delivered"
  }
  ```
* **Result**: **REJECTED**. Creating a new order mandates that its `status` equal `"Pending"`.

### Attack Vector 4: Global Orders Harvesting (Query Scraping)
* **Description**: An external actor executes a bulk collection query `db.collection('orders')` to scrape names, addresses, and phone numbers of Bangladeshi home food buyers.
* **Payload**:
  ```javascript
  // Javascript execution
  getDocs(collection(db, 'orders'));
  ```
* **Result**: **REJECTED**. The rules assert that `/orders` can never be queried in a general list context by unauthenticated public clients (`allow list: if false;` or strict query filter limits for corresponding owners). Only authenticated admin operators have bulk view clearance.

### Attack Vector 5: Tampering with Delivery Charge Variables
* **Description**: A customer changes the global site configuration file to set the mandatory delivery charges to 0 BDT.
* **Payload**:
  ```json
  // PATCH /siteConfig/global
  {
    "deliveryChargeInside": 0,
    "deliveryChargeOutside": 0
  }
  ```
* **Result**: **REJECTED**. Global `siteConfig` modifications require authenticated `super_admin` signatures.

### Attack Vector 6: Bypassing bKash Transaction ID Requirements
* **Description**: An attacker submits a cash-on-delivery order but claims to pay 0 BDT, yet tries to bypass the bKash transaction confirmation by supplying null fields when COD is selected.
* **Payload**:
  ```json
  // POST /orders/rand-order-uuid-2
  {
    "...": "...",
    "paymentMethod": "Cash on Delivery",
    "bKashNumber": "",
    "transactionId": ""
  }
  ```
* **Result**: **REJECTED**. Our schemas specify that bKash verification values must be valid strings of defined bounds when Cash on Delivery is selected, as Dhaka delivery charges are paid in advance via bKash.

### Attack Vector 7: Illegal State Transition (Bypassing Admin Lock)
* **Description**: A customer whose order status is set to `'Cancelled'` attempts to force-update it back to `'Pending'` or `'Out for Delivery'`.
* **Payload**:
  ```json
  // PATCH /orders/rand-order-uuid
  {
    "status": "Pending"
  }
  ```
* **Result**: **REJECTED**. Customers have zero write permissions to any fields on their orders once saved. Status updates can only occur via the Admin Dashboard.

### Attack Vector 8: Deleting Historical Audit Logs
* **Description**: A rogue operator attempts to wipe clean the activity log database entries to hide unauthorized menu deletes.
* **Payload**:
  ```javascript
  // Delete execution
  deleteDoc(doc(db, 'activityLogs', 'unauthorized_deletion_log'));
  ```
* **Result**: **REJECTED**. The `/activityLogs` path explicitly blocks all `delete` and `update` commands.

### Attack Vector 9: Shadow Field Insertion ("Ghost Properties")
* **Description**: An actor attempts to inject a custom boolean `isAdminOverride: true` or `bypassed: true` inside a standard order data structure.
* **Payload**:
  ```json
  // POST /orders/rand-order-uuid-3
  {
    "id": "rand-order-uuid-3",
    "fullName": "User",
    "phoneNumber": "01721111111",
    "fullAddress": "Dhaka, BD",
    "items": [],
    "totalPrice": 120,
    "deliveryCharge": 60,
    "paymentMethod": "bKash Payment",
    "status": "Pending",
    "isAdminOverride": true
  }
  ```
* **Result**: **REJECTED**. Document creation must pass exact key listing checks checking that only specified fields exist.

### Attack Vector 10: Denying Wallet via Oversized Document Fields
* **Description**: An attacker posts an order where the customer's full address is a 5-megabyte string, designed to consume project database writes, reads, and egress bandwidth.
* **Payload**:
  ```json
  // POST /orders/overflow
  {
    "fullName": "Spammed User Name",
    "phoneNumber": "01700000000",
    "fullAddress": "[A 5,000,000 character junk string]",
    "...": "..."
  }
  ```
* **Result**: **REJECTED**. Standard String type schemas inside the validation helpers enforce a maximum boundary check of `.size() <= 1000` characters for names and addresses.

### Attack Vector 11: Tampering with Historical Invoice Balances
* **Description**: A customer attempts to lower the `totalPrice` inside their invoice after order creation to trick delivery personnel database logs.
* **Payload**:
  ```json
  // PATCH /orders/existing_order_id
  {
    "totalPrice": 50
  }
  ```
* **Result**: **REJECTED**. All user writes on active order files are restricted once sent. Operators can adjust orders, but clients are blocked entirely from updating structural fields.

### Attack Vector 12: Anonymous User Path Shell Poisoning
* **Description**: An attacker pushes a malformed path parameter `{orderId}` structured with carriage returns, sql delimiters, or excessive directories `/orders/../../attacker_admins`.
* **Payload**:
  ```javascript
  // Injection trial
  getDoc(doc(db, 'orders', '../../admins/my_admin_record'));
  ```
* **Result**: **REJECTED**. Document IDs are restricted at the match brackets, and path variables are validated via `isValidId()`. Any string containing invalid directory structures `/` or injection sequences will fail.
