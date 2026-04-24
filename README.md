# Modern ChatAPP - Inspired by Whatsapp

## 1) Login / Logout

### Login (Google)
1. Open the site.
2. Tap **Sign in with Google**.
3. Choose your Google account.
4. On Succes you are redirected into the app.

**How it works:**
- The client sends your Google Token to the backend: `POST /api/auth/google`
- Backend sets auth cookies:
 - `access_token`
 - `refresh_token`

### Logut
- Use the logout option which is available in profile page
- Backend endpoint: `POST /api/auth/logout` (It will clear the cookies)

---

## 2) Home / Chats List (Friends List)

When you open Chat Screen, you see a list of your friends (your “chat list”).

Each friend row typically shows:
- Avatar
- Name + Email
- **Online/Last Seen**
- **Unread indicator** (e.g., `3+ New Messages`)
- **Lock icon 🔒** if that chat is locked

### Open a chat
- **Tap** a friend row to open chat with them.
- If the chat is locked, you must enter your PIN first (Will be explained in section 4)

---

## 3) Sending Messages (Text, Image, View Once Image)

### Send a text message
1. Open a chat.
2. Type in the message box.
3. Press **Send** (or hit Enter on keyboard).

### Send an image
1. Tap **Add Image**
2. Choose an image
3. Press **Send**

### Send a “View Once” image
1. Tap **Add View Once Image**
2. Choose an image
3. Press **Send**
4. The receiver can view it, and after it is marked as viewed it should no longer show as an image.

**How it works:**
- Regular send: `POST /api/auth/chat/send`
- Image upload: `POST /api/auth/chat/upload` (multipart upload)
- View once is sent by settinng: `is_view_once: true`
- The app marks view-once as viewed using: `PUT /api/auth/chat/message/view/:id`

---

## 4) Lock a Chat (Long Press)

You can lock a chat with a PIN. This prevents opening the chat until the PIN is entered.

### Lock a chat (Set PIN)
1. Go the the **friends/chat list**.
2. **Long-press** on the friend row for about **0.7 seconds**.
3. A modal opens called **Lock Chat**.
4. Enter a numeric PIN (**minimum 4 digits**; max input length is 6).
5. Tap **Lock**.

You will now see a **🔒** icon on that friend in the list.

### Open a locked chat (PIN required)
1. Tap the locked friend.
2. A **PIN entry** modal appears (“This chat is locked”).
3. Enter PIN and tap **Open**.
4. If PIN is wrong, it shows: **”Wrong PIN. Try Again.”**

### Remove Lock (Unlock chat)
1. Go to the **chat list**.
2. **Long-press** the locked friend again (~ 0.7 sec).
3. Modal changes to **“Remove Lock”**.
4. Enter the PIN.
5. Tap **Remove Lock**.

**How it works:**
- Lock chat: `POST /api/auth/chat/lock/:friendId` with body `{ "pin" : "1234" }`
- Verify PIN to open: `POST /api/auth/chat/lock/verify/:friendId`
- Remove Lock: `DELETE /api/auth/chat/lock/:friendId` with body `{ "pin" : "1234z' }
- Locked chats list: `GET /api/auth/chat/locks` → returns `LockedFriendIds`

---

## 5) Message Actions (Long Press / Double click)

### React to a message (Emoji Reaction)
- **Double-Click** any message bubble to open the reaction modal.
- Select an emoji (😂 ❤️ 🔥 🥲 😭 🥰 🥹 🙏).
- The reaction appears under the message bubble.

**Technical:**
- `PUT /api/auth/chat/message/react/:id` with `{ "emoji" : "❤️" }`

### Edit you message (Long Press on your own message)
- You can only open actions on **your own messages** (sent by you).
1. **Long-press** your message bubble for about **1 second**
2. Bottom sheet opens with:
   - **Edit Message**
   - **Delete Message**
3. Tap **Edit Message**
4. Update text and tap **Save**

**Technical:**
- `PUT /api/auth/chat/message/:id` with `{ "content" : "new text" }`

### Delete your message (Long press on your own message)
1. **Long-Press** your own message (~1 second)
2. Tap **Delete Message**

**Inportant behavior:**
- This is a **soft delete**:
  - Content is cleared
  - Image URL is cleared
  - `IsDeleted` becomes `true`
- In UI, deleted messages show as:  *“Message Deleted”*
- Only the **sender** can delete their messagge (server checks sender ID).

**Technical:**
- `PUT /api/auth/chat/message/delete/:id`

> Note: There is **no “delete entire chat conversion”** / ”clear chat history” button implementer in the routes down. Only per-message delete is implemented

---

## 6) Seen / Read Recipts

### When Message becomes “Seen”
- When you open a chat, the app may mark messages from the other user as read/seen.
- The UI may show `Seen ✓` on your last sent message once the reciever reads it.

**Technical endpoints involved:**
- Mark Seen: `PUT /api/auth/messages/seen/:email`

## 7) Typing Indicator

- While someone is typing, you may see **Typing** / “Someone is typing...”

**How it works:**
- Client sends webSocket message with `{ type: "typing" , from, to }`

--- 

## 8) Sharing Location

You can share your current location with the user.

### share location steps
1. Open a chat.
2. Tap the **location icon**.
3. Confirm “Share Location ?”
4. Allow browser location permission (if asked)
5. The receiver gets a **Shared Location** message.
6. Tapping it opens maps.

If permission is denied, you.ll see a **Location Access Denied** popup.

**Technical:**
- Message is sent using `POST /api/auth/chat/send` with:
  - `is_location: true`
  - `latitude`,`longitude`

---

## 9) Friends

### Send a friend request.
1. Go to Friends Page.
2. Enter email of your friend.
3. Tap send.

**Technical:**
- `POST /api/auth/friend/request` with `{ "email" : "carlson@example.com" }`

### Accept / Reject requests
- Accept: `POST /api/auth/friend/accept/:id`
- Reject: `POST /api/auth/friend/reject/:id`

### Remove a friend
- `DELETE /api/auth/friend/:id`

--- 

## 10) Blocking Users

### Block
- `POST /api/auth/block/:id`

### Unblock
- `DELETE /api/auth/unblock/:id`

### View blocked users
- `GET /api/auth/blocks`

Blocking typically removes friend relationship and requests (server side logic does cleanup).

---

## 11) Groups (Basics)

### Create Group
- `POST /api/auth/group`

### View my groups
- `GET /api/auth/groups`

### Group Messages
- Send: `POST /api/auth/group/:id/messages`
- Fetch: `GET /api/auth/group/:id/messages`

### Group Member management (This can be possible by admins only)
- Add member: `POST /api/auth/group/:id/member`
- Change role: `PUT /api/auth/group/:id/member/:userId/role`
- Remove member: `DELETE /api/auth/group/:id/member/:userId`

### Group message edit/delete/react
- Edit: `PUT /api/auth/group/message/:id`
- Delete: `DELETE /api/auth/group/message/:id`
- React: `PUT /api/auth/group/message/:id/react`

---

## 12) Common Questions (FAQ)

### Q: How do I unlock a chat?
A: Long-press the locked friend again, choose remove lock, enter PIN.

### Q: How do I delete chats?
A:
- **Delete a message:** Long-press you own message (~1sec) → Delete Message.
- **Delete entire chat (all messages):** Not currently available.

### Q: Can I delete Someone else's messages?
A: No. Deleting is restricted to the sender.

### Q: What is “View Once”?
A: It's an image message that disappers after it's viewed (backend marks it viewed and client hides it).

---

## 13) Tips / Best Pratices

- Use a PIN you can remember; there is no "reset PIN" flow shown in UI. If urgent contact me @jaisondavidm.cs25@bitsathy.ac.in
- If location sharing is denied, enable it from browser settings and reload.


## 14) Basic Notes

- Use a personal network/mobile data when accessing the site. Avoid some organisation/corporate networks, as they block connections required for the TiDB database service
- The Login system may not work in Incognito/Private mode, since browser restrictions can block cookies, local storage, or session data. Use a normal browser window for best results.

## 15) Admin Panel Usage

The application includes an **Admin Dashboard** for managing users and monitoring platform activity.

---

### Who is an Admin ?

There are two elevated roles:

#### `admin`
- Can view dashboard
- Can promote / demote users
- Can view platform stats

#### `superadmin`
- Has all admin permissions
- Cannot be modified by normal admins
- Reserver for system-level control

---

### 📊 Accessing Admin Dashboard

1. Login with an account that has `admin` or `superadmin` role.
2. Navigate to: /admin
3. you will see:
- Platform Statistics (users , groups)
- User List
- Role Management Controls

---

### Dashboard Features

#### Platform Overview

Displays:
- Total Users
- Active Users
- Total Groups
- Active Groups

**Technical:**
GET /api/auth/admin/stats

---

#### Users List

Shows:
- Avatar
- Name + Email
- Role (`user`,`admin`,`superadmin`)
- Status (Active/Disabled)

**Technical:**
GET /api/auth/admin/users

---

### Role Management

Admins can change user roles directly from the dashboard.

#### Promote User → Admin
- Click **Promote** button
- Confirm action in modal

#### Demote Admin → User
- Click **Demote**
- Confirm action in modal

**Technical:**
PUT /api/auth/admin/user/role/:id
``json
{
  "role":"admin"
}
``

## 🚀 Optimization

### 📌 Overview
To improve performance and scalability, multiple optimizations were applied across both frontend and backend. These changes helped reduce load time, improve responsiveness, and enhance the overall user experience.

---

### ⚡ Optimization Techniques

#### 1) Frontend Optimization (Lazy Loading & Efficient Rendering)
- Implemented lazy loading for major pages like Chat, Friends, Groups, and Admin Dashboard.
- Reduced unnecessary re-renders by organizing components efficiently.
- Split code into smaller chunks to improve loading performance.

**Result:**
- Faster initial load time  
- Reduced bundle size  
- Smooth navigation between pages  

---

#### 2) Backend Optimization (API & Database Efficiency)
- Reduced redundant API calls by fetching only necessary data.
- Optimized database queries using better structuring and indexing.
- Improved middleware usage to avoid unnecessary processing.

**Result:**
- Faster API response time  
- Reduced server load  
- Better scalability  

---

#### 3) Media Optimization (Image Handling)
- Controlled image upload size and optimized file handling.
- Avoided sending large unnecessary files in chat.

**Result:**
- Reduced bandwidth usage  
- Faster image/message delivery  

---

### 📊 Overall Impact
- Improved application responsiveness  
- Reduced load time  
- Better real-time chat experience  

---

### 🌐 Deployment
The project is deployed in a production environment with optimized configurations for better performance and stability.

## Folder Sturcture
chat-app/
├─ client/                         # Frontend (React + Vite)
│  ├─ src/
│  │  ├─ Pages/                    # Main screens (Login, Chat, Friends, Groups, etc.)
│  │  ├─ Components/               # Reusable UI components (Layout, Loading, etc.)
│  │  ├─ context/                  # React Context (AuthContext, etc.)
│  │  └─ api/                      # Axios instance + API helper code
│  ├─ public/                      # Static assets (if present)
│  ├─ nginx.conf                   # Nginx config used by Docker image
│  ├─ client.Dockerfile            # Docker build for frontend (Node build -> Nginx serve)
│  ├─ package.json
│  ├─ package-lock.json
│  └─ README.md                    # (Currently the default Vite template)
│
├─ server/                         # Backend (Go + Gin + GORM)
│  ├─ main.go                      # Server entrypoint (starts Gin on :8000)
│  ├─ server.Dockerfile            # Docker build for backend
│  ├─ routes/
│  │  └─ routes.go                 # All API route registrations (/api/auth/...)
│  ├─ handlers/                    # API controllers/handlers (chat, auth, friends, groups, locks)
│  ├─ models/                      # DB models (User, Message, Group, etc.)
│  ├─ middleware/                  # Middleware (CORS, auth, etc.)
│  ├─ config/
│  │  ├─ db.go                     # DB connection (DB_DSN, retries)
│  │  └─ migrate.go                # Auto-migrations
│  ├─ utils/                       # Helpers (JWT, token verify/generate, etc.)
│  └─ uploads/                     # Uploaded files folder (served at /uploads)
│
├─ docker-compose.yml              # Runs MySQL + server + client containers
├─ USER_GUIDE.md                   # (Recommended) end-user manual (how to use the app)
└─ README.md                       # (Recommended) main project README