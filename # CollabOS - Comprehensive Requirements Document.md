\# CollabOS \- Comprehensive Requirements Document

\#\# Table of Contents  
1\. \[Application Overview\](\#1-application-overview)  
2\. \[System Architecture\](\#2-system-architecture)  
3\. \[User Roles and Permissions\](\#3-user-roles-and-permissions)  
4\. \[Core Feature Workflows\](\#4-core-feature-workflows)  
5\. \[Data Models and Relationships\](\#5-data-models-and-relationships)  
6\. \[Business Logic and Rules\](\#6-business-logic-and-rules)  
7\. \[Integration Points\](\#7-integration-points)  
8\. \[Security and Privacy\](\#8-security-and-privacy)  
9\. \[Performance Requirements\](\#9-performance-requirements)  
10\. \[Acceptance Criteria\](\#10-acceptance-criteria)

\---

\#\# 1\. Application Overview

\#\#\# 1.1 Application Identity  
\*\*Name:\*\* CollabOS    
\*\*Type:\*\* Freelance Operating System (Web Application)    
\*\*Purpose:\*\* Comprehensive platform for skill-based collaboration, trade management, and professional networking

\#\#\# 1.2 Core Value Proposition  
CollabOS enables professionals to exchange skills without monetary transactions, building a trust-based economy where expertise is the currency. The platform facilitates skill discovery, trade negotiation, collaboration, and reputation building.

\#\#\# 1.3 Key Differentiators  
\- \*\*Skill-Based Economy\*\*: Trade skills instead of money  
\- \*\*Trust Score System\*\*: Reputation-based credibility scoring  
\- \*\*ProofChain\*\*: Verifiable portfolio of completed work  
\- \*\*Workspace Collaboration\*\*: Real-time team collaboration tools  
\- \*\*Dispute Resolution\*\*: Built-in mediation system  
\- \*\*Knowledge Base\*\*: Curated learning resources

\---

\#\# 2\. System Architecture

\#\#\# 2.1 Technology Stack  
\`\`\`  
Frontend:  
├── React 18 (UI Framework)  
├── TypeScript (Type Safety)  
├── Vite (Build Tool)  
├── Tailwind CSS (Styling)  
├── shadcn/ui (Component Library)  
├── Zustand (State Management)  
├── TanStack Query (Data Fetching)  
└── React Router (Navigation)

Backend:  
├── Supabase (Backend-as-a-Service)  
│   ├── PostgreSQL (Database)  
│   ├── Row Level Security (RLS)  
│   ├── Edge Functions (Serverless)  
│   ├── Realtime (WebSocket)  
│   └── Storage (File Management)

Third-Party:  
├── Stripe (Payment Processing)  
├── Sentry (Error Tracking)  
└── Google Analytics (Analytics)  
\`\`\`

\#\#\# 2.2 Database Architecture

\#\#\#\# 2.2.1 Core Tables  
\`\`\`sql  
\-- User Management  
profiles (id, email, mononym, full\_name, avatar\_url, bio, dna\_type,   
         skill\_tags, trust\_score, role, created\_at, updated\_at)

\-- Skill Trading  
listings (id, owner\_user\_id, title, description, skill\_offered,   
         skill\_wanted, duration\_hours, status, expires\_at, created\_at)

trades (id, listing\_id, requester\_user\_id, owner\_user\_id, status,   
       proposed\_hours, message, created\_at, updated\_at)

\-- Collaboration  
workspaces (id, name, description, owner\_user\_id, status, created\_at)  
workspace\_members (workspace\_id, user\_id, role, joined\_at)  
workspace\_messages (id, workspace\_id, user\_id, message, created\_at)

\-- Reputation System  
proofs (id, user\_id, title, description, proof\_type, media\_urls,   
       skill\_tags, visibility, created\_at)

endorsements (id, endorser\_user\_id, endorsed\_user\_id, skill\_tag,   
             message, created\_at)

reviews (id, trade\_id, reviewer\_user\_id, reviewee\_user\_id, rating,   
        comment, created\_at)

\-- Trust & Security  
trust\_score\_history (id, user\_id, event\_type, delta, reason, created\_at)  
disputes (id, trade\_id, complainant\_user\_id, respondent\_user\_id,   
         reason, status, resolution, created\_at)

\-- Content & Learning  
knowledge\_base\_articles (id, title, content, category, author\_user\_id,   
                        status, created\_at)  
\`\`\`

\#\#\#\# 2.2.2 Relationship Diagram  
\`\`\`  
profiles (1) ──\< (many) listings  
profiles (1) ──\< (many) trades (requester)  
profiles (1) ──\< (many) trades (owner)  
listings (1) ──\< (many) trades  
trades (1) ──\< (1) reviews  
trades (1) ──\< (0..1) disputes  
profiles (1) ──\< (many) proofs  
profiles (1) ──\< (many) endorsements (endorser)  
profiles (1) ──\< (many) endorsements (endorsed)  
profiles (1) ──\< (many) workspaces (owner)  
workspaces (1) ──\< (many) workspace\_members  
workspaces (1) ──\< (many) workspace\_messages  
\`\`\`

\#\#\# 2.3 Authentication Flow

\#\#\#\# 2.3.1 Registration Workflow  
\`\`\`  
User Action → System Response → Database Operation → Result

1\. User fills registration form  
   ├── Email  
   ├── Password (min 8 chars, 1 uppercase, 1 number)  
   ├── Full Name  
   └── Mononym (unique identifier)

2\. System validates input  
   ├── Check email format  
   ├── Verify password strength  
   ├── Validate mononym uniqueness  
   └── Check required fields

3\. Supabase Auth creates user  
   ├── Generate user ID (UUID)  
   ├── Hash password (bcrypt)  
   ├── Send verification email  
   └── Create auth.users record

4\. Database trigger creates profile  
   ├── Insert into profiles table  
   ├── Set default trust\_score \= 50  
   ├── Set role \= 'user'  
   └── Initialize notification\_preferences

5\. User verifies email  
   ├── Click verification link  
   ├── Update email\_confirmed\_at  
   └── Enable account access

6\. Redirect to onboarding  
   ├── Complete profile setup  
   ├── Select DNA type  
   ├── Add skill tags  
   └── Upload avatar (optional)  
\`\`\`

\#\#\#\# 2.3.2 Login Workflow  
\`\`\`  
User Action → Authentication → Session Management → Dashboard

1\. User enters credentials  
   ├── Email  
   └── Password

2\. Supabase Auth validates  
   ├── Query auth.users table  
   ├── Compare password hash  
   ├── Check email\_confirmed\_at  
   └── Verify account status

3\. Generate session token  
   ├── Create JWT token  
   ├── Set expiration (30 days)  
   ├── Store in httpOnly cookie  
   └── Return access token

4\. Fetch user profile  
   ├── Query profiles table  
   ├── Load user data  
   ├── Store in Zustand state  
   └── Initialize app context

5\. Redirect to dashboard  
   ├── Load dashboard data  
   ├── Fetch notifications  
   ├── Display welcome message  
   └── Show activity feed  
\`\`\`

\---

\#\# 3\. User Roles and Permissions

\#\#\# 3.1 Role Hierarchy

\#\#\#\# 3.1.1 User (Default)  
\*\*Capabilities:\*\*  
\- Create and manage own listings  
\- Browse and search marketplace  
\- Submit trade proposals  
\- Participate in workspaces (as member)  
\- Create and manage proofs  
\- Give and receive endorsements  
\- Access knowledge base  
\- Manage own profile

\*\*Restrictions:\*\*  
\- Cannot access admin panel  
\- Cannot moderate content  
\- Cannot resolve disputes  
\- Cannot manage platform settings

\#\#\#\# 3.1.2 Admin  
\*\*Capabilities:\*\*  
\- All User capabilities, plus:  
\- Access admin dashboard  
\- View all users and profiles  
\- Moderate listings and content  
\- Resolve disputes  
\- View platform analytics  
\- Manage knowledge base articles  
\- Send platform notifications

\*\*Restrictions:\*\*  
\- Cannot change platform settings  
\- Cannot manage other admins  
\- Cannot access financial reports

\#\#\#\# 3.1.3 Owner  
\*\*Capabilities:\*\*  
\- All Admin capabilities, plus:  
\- Manage platform settings  
\- Promote/demote admins  
\- Access financial reports  
\- Configure integrations  
\- Manage database  
\- Deploy updates

\*\*Restrictions:\*\*  
\- None (full system access)

\#\#\# 3.2 Permission Matrix

| Feature | User | Admin | Owner |  
|---------|------|-------|-------|  
| Create Listing | ✓ | ✓ | ✓ |  
| Edit Own Listing | ✓ | ✓ | ✓ |  
| Delete Own Listing | ✓ | ✓ | ✓ |  
| Moderate Any Listing | ✗ | ✓ | ✓ |  
| Submit Trade Proposal | ✓ | ✓ | ✓ |  
| Accept/Reject Trade | ✓ | ✓ | ✓ |  
| Create Workspace | ✓ | ✓ | ✓ |  
| Manage Own Workspace | ✓ | ✓ | ✓ |  
| View All Workspaces | ✗ | ✓ | ✓ |  
| Create Proof | ✓ | ✓ | ✓ |  
| Moderate Proofs | ✗ | ✓ | ✓ |  
| Give Endorsement | ✓ | ✓ | ✓ |  
| File Dispute | ✓ | ✓ | ✓ |  
| Resolve Dispute | ✗ | ✓ | ✓ |  
| Access Admin Panel | ✗ | ✓ | ✓ |  
| View Analytics | ✗ | ✓ | ✓ |  
| Manage Users | ✗ | ✓ | ✓ |  
| Platform Settings | ✗ | ✗ | ✓ |

\---

\#\# 4\. Core Feature Workflows

\#\#\# 4.1 Skill Trading Lifecycle

\#\#\#\# 4.1.1 Listing Creation Workflow  
\`\`\`  
Step 1: User Initiates Listing  
├── Navigate to "My Listings"  
├── Click "Create New Listing"  
└── Form opens with fields

Step 2: Fill Listing Details  
├── Title (required, max 100 chars)  
├── Description (required, max 1000 chars)  
├── Skill Offered (required, tag selection)  
├── Skill Wanted (required, tag selection)  
├── Duration Hours (required, number)  
├── Expiration Date (optional, default 30 days)  
└── Validation runs on each field

Step 3: System Validation  
├── Check required fields  
├── Validate skill tags exist  
├── Verify duration \> 0  
├── Confirm expiration \> current date  
└── Display errors if any

Step 4: Database Operation  
├── INSERT into listings table  
│   ├── Generate UUID for id  
│   ├── Set owner\_user\_id \= current user  
│   ├── Set status \= 'active'  
│   ├── Set created\_at \= now()  
│   └── Set expires\_at \= calculated date  
├── Update user's listing count  
└── Trigger notification to followers

Step 5: Post-Creation Actions  
├── Redirect to listing detail page  
├── Display success toast  
├── Index listing for search  
└── Add to activity feed  
\`\`\`

\#\#\#\# 4.1.2 Trade Proposal Workflow  
\`\`\`  
Step 1: Requester Discovers Listing  
├── Browse marketplace  
├── Apply filters (skill, duration, etc.)  
├── View listing details  
└── Click "Propose Trade"

Step 2: Proposal Submission  
├── Fill proposal form  
│   ├── Proposed hours (default: listing hours)  
│   ├── Message (required, max 500 chars)  
│   └── Availability dates (optional)  
├── Validate input  
└── Submit proposal

Step 3: Database Transaction  
├── BEGIN TRANSACTION  
├── INSERT into trades table  
│   ├── listing\_id \= selected listing  
│   ├── requester\_user\_id \= current user  
│   ├── owner\_user\_id \= listing owner  
│   ├── status \= 'pending'  
│   ├── proposed\_hours \= input value  
│   └── message \= input text  
├── INSERT into notifications  
│   ├── user\_id \= listing owner  
│   ├── type \= 'trade\_proposal'  
│   ├── related\_id \= trade.id  
│   └── message \= "New trade proposal"  
├── INSERT into activity\_feed  
│   ├── user\_id \= listing owner  
│   ├── actor\_user\_id \= requester  
│   ├── action \= 'proposed\_trade'  
│   └── related\_id \= trade.id  
├── COMMIT TRANSACTION  
└── Trigger Edge Function: notify-trade-proposal

Step 4: Owner Notification  
├── Real-time notification via Supabase Realtime  
├── Email notification (if enabled)  
├── In-app notification badge update  
└── Activity feed entry

Step 5: Owner Reviews Proposal  
├── Navigate to "Trades" → "Received"  
├── View proposal details  
│   ├── Requester profile  
│   ├── Trust score  
│   ├── Proposed hours  
│   ├── Message  
│   └── Requester's proofs  
├── Decision options:  
│   ├── Accept  
│   ├── Reject  
│   └── Counter-offer

Step 6A: Accept Trade  
├── Click "Accept"  
├── UPDATE trades SET status \= 'accepted'  
├── UPDATE listings SET status \= 'in\_progress'  
├── CREATE workspace for collaboration  
│   ├── name \= "Trade: {listing.title}"  
│   ├── owner\_user\_id \= listing owner  
│   ├── Add both users as members  
│   └── Create welcome message  
├── NOTIFY requester  
│   ├── Notification: "Trade accepted"  
│   ├── Email: "Your trade proposal was accepted"  
│   └── Activity feed entry  
└── Redirect to workspace

Step 6B: Reject Trade  
├── Click "Reject"  
├── Optional: Add rejection reason  
├── UPDATE trades SET status \= 'rejected'  
├── NOTIFY requester  
│   ├── Notification: "Trade proposal declined"  
│   └── Activity feed entry  
└── Listing remains active

Step 6C: Counter-offer  
├── Click "Counter-offer"  
├── Modify proposed hours  
├── Add counter-offer message  
├── UPDATE trades  
│   ├── SET proposed\_hours \= new value  
│   ├── SET status \= 'counter\_offered'  
│   └── ADD counter\_offer\_message  
├── NOTIFY requester  
│   ├── Notification: "Counter-offer received"  
│   └── Show counter-offer details  
└── Requester can accept/reject counter  
\`\`\`

\#\#\#\# 4.1.3 Trade Execution Workflow  
\`\`\`  
Step 1: Workspace Collaboration  
├── Both users access workspace  
├── Real-time chat communication  
├── Share files and resources  
├── Track progress with milestones  
└── Update trade status

Step 2: Work Completion  
├── User marks work as complete  
├── Upload proof of work  
│   ├── Screenshots  
│   ├── Files  
│   ├── Links  
│   └── Description  
├── Notify other party  
└── Request review

Step 3: Mutual Confirmation  
├── Both parties confirm completion  
├── UPDATE trades SET status \= 'completed'  
├── UPDATE listings SET status \= 'completed'  
├── Trigger completion workflow  
└── Enable review submission

Step 4: Review Exchange  
├── Both users submit reviews  
│   ├── Rating (1-5 stars)  
│   ├── Comment (optional)  
│   └── Skill tags validation  
├── INSERT into reviews table  
├── Calculate average rating  
└── Update user profiles

Step 5: Trust Score Update  
├── Call Edge Function: recalculate-trust-score  
├── Calculate delta based on:  
│   ├── Review rating  
│   ├── Trade completion  
│   ├── Response time  
│   └── Dispute history  
├── UPDATE profiles.trust\_score  
├── INSERT into trust\_score\_history  
└── Notify user of score change

Step 6: ProofChain Update  
├── Create proof from trade  
│   ├── title \= trade title  
│   ├── description \= work done  
│   ├── proof\_type \= 'trade'  
│   ├── media\_urls \= uploaded files  
│   └── skill\_tags \= skills used  
├── INSERT into proofs table  
├── Link to trade record  
└── Display in user's ProofChain  
\`\`\`

\#\#\# 4.2 Workspace Collaboration Workflow

\#\#\#\# 4.2.1 Workspace Creation  
\`\`\`  
Step 1: User Initiates Creation  
├── Navigate to "Workspaces"  
├── Click "Create Workspace"  
└── Form opens

Step 2: Fill Workspace Details  
├── Name (required, max 100 chars)  
├── Description (optional, max 500 chars)  
├── Privacy (public/private)  
└── Initial members (optional)

Step 3: Database Operation  
├── INSERT into workspaces table  
│   ├── id \= UUID  
│   ├── owner\_user\_id \= current user  
│   ├── status \= 'active'  
│   └── created\_at \= now()  
├── INSERT into workspace\_members  
│   ├── workspace\_id \= new workspace  
│   ├── user\_id \= owner  
│   ├── role \= 'owner'  
│   └── joined\_at \= now()  
└── Create default channels

Step 4: Invite Members (Optional)  
├── Select users to invite  
├── INSERT into workspace\_invitations  
├── NOTIFY invited users  
└── Send email invitations  
\`\`\`

\#\#\#\# 4.2.2 Real-time Chat Workflow  
\`\`\`  
Step 1: User Sends Message  
├── Type message in chat input  
├── Optional: Attach files  
├── Optional: Mention users (@username)  
└── Press Enter or click Send

Step 2: Client-side Processing  
├── Validate message (not empty)  
├── Upload attachments to Supabase Storage  
├── Generate temporary message ID  
├── Optimistically add to UI  
└── Send to server

Step 3: Server Processing  
├── INSERT into workspace\_messages  
│   ├── id \= UUID  
│   ├── workspace\_id \= current workspace  
│   ├── user\_id \= sender  
│   ├── message \= text content  
│   ├── attachments \= file URLs  
│   ├── mentions \= mentioned user IDs  
│   └── created\_at \= now()  
├── Validate user is workspace member  
└── Check message content (spam filter)

Step 4: Real-time Broadcast  
├── Supabase Realtime publishes message  
├── All connected clients receive update  
├── Update UI with real message ID  
├── Remove optimistic message  
└── Scroll to new message

Step 5: Notification Processing  
├── For each mentioned user:  
│   ├── INSERT into notifications  
│   ├── type \= 'workspace\_mention'  
│   └── Send push notification  
├── For offline members:  
│   ├── Queue email notification  
│   └── Update unread count  
└── Update workspace last\_activity  
\`\`\`

\#\#\#\# 4.2.3 File Sharing Workflow  
\`\`\`  
Step 1: User Uploads File  
├── Click "Attach File" button  
├── Select file from device  
├── Validate file:  
│   ├── Size \< 10MB  
│   ├── Allowed types (images, docs, PDFs)  
│   └── Scan for malware  
└── Show upload progress

Step 2: Upload to Storage  
├── Generate unique filename  
│   ├── Format: {workspace\_id}/{timestamp}\_{original\_name}  
│   └── Prevent collisions  
├── Upload to Supabase Storage bucket  
│   ├── Bucket: workspace-files  
│   ├── Path: {workspace\_id}/  
│   └── Public: false (requires auth)  
├── Generate signed URL (expires 1 hour)  
└── Return file metadata

Step 3: Create Message with Attachment  
├── INSERT into workspace\_messages  
│   ├── message \= file description  
│   ├── attachments \= \[{  
│   │     name: original filename,  
│   │     url: storage URL,  
│   │     size: file size,  
│   │     type: MIME type  
│   │   }\]  
│   └── created\_at \= now()  
├── Broadcast via Realtime  
└── Display in chat

Step 4: File Access  
├── User clicks file in chat  
├── Check permissions:  
│   ├── User is workspace member  
│   └── File exists in storage  
├── Generate new signed URL  
├── Download or preview file  
└── Log access in audit trail  
\`\`\`

\#\#\# 4.3 ProofChain & Reputation Workflow

\#\#\#\# 4.3.1 Proof Creation Workflow  
\`\`\`  
Step 1: User Creates Proof  
├── Navigate to "ProofChain"  
├── Click "Add Proof"  
└── Select proof type:  
    ├── Project  
    ├── Trade  
    ├── Certification  
    └── Achievement

Step 2: Fill Proof Details  
├── Title (required, max 100 chars)  
├── Description (required, max 1000 chars)  
├── Skill Tags (required, min 1, max 5\)  
├── Media Upload (optional)  
│   ├── Images (max 5, 5MB each)  
│   ├── Videos (max 1, 50MB)  
│   └── Documents (max 3, 10MB each)  
├── Links (optional, max 3\)  
├── Visibility (public/private/connections)  
└── Date Completed (optional)

Step 3: Media Processing  
├── For each uploaded file:  
│   ├── Compress images (max 1920px width)  
│   ├── Generate thumbnails  
│   ├── Upload to Supabase Storage  
│   │   ├── Bucket: proof-media  
│   │   ├── Path: {user\_id}/{proof\_id}/  
│   │   └── Generate public URL  
│   └── Store metadata

Step 4: Database Operation  
├── INSERT into proofs table  
│   ├── id \= UUID  
│   ├── user\_id \= current user  
│   ├── title, description, proof\_type  
│   ├── skill\_tags \= array of tags  
│   ├── media\_urls \= array of URLs  
│   ├── visibility \= selected option  
│   ├── created\_at \= now()  
│   └── updated\_at \= now()  
├── Update user's proof count  
└── Index for search

Step 5: Skill Tag Validation  
├── For each skill tag:  
│   ├── Check if tag exists in skill\_tags table  
│   ├── If not, suggest similar tags  
│   ├── Increment tag usage count  
│   └── Update user's skill\_tags array  
└── Recalculate skill proficiency

Step 6: Visibility & Sharing  
├── If public:  
│   ├── Add to public ProofChain feed  
│   ├── Notify followers  
│   └── Index for discovery  
├── If private:  
│   ├── Only visible to user  
│   └── Can share via link  
└── If connections:  
    ├── Visible to endorsed users  
    └── Visible to trade partners  
\`\`\`

\#\#\#\# 4.3.2 Endorsement Workflow  
\`\`\`  
Step 1: User Gives Endorsement  
├── View another user's profile  
├── Click "Endorse" button  
├── Select skill to endorse  
│   ├── Must be in user's skill\_tags  
│   └── Can only endorse once per skill  
└── Write endorsement message (optional)

Step 2: Validation  
├── Check endorser has worked with user  
│   ├── Completed trade together, OR  
│   ├── Workspace collaboration, OR  
│   ├── Admin override  
├── Verify skill tag exists  
├── Check not self-endorsement  
└── Check not duplicate endorsement

Step 3: Database Operation  
├── INSERT into endorsements table  
│   ├── id \= UUID  
│   ├── endorser\_user\_id \= current user  
│   ├── endorsed\_user\_id \= target user  
│   ├── skill\_tag \= selected skill  
│   ├── message \= endorsement text  
│   └── created\_at \= now()  
├── Update endorsed user's endorsement count  
└── Recalculate skill credibility

Step 4: Trust Score Impact  
├── Call Edge Function: recalculate-trust-score  
├── Calculate delta:  
│   ├── Base: \+2 points  
│   ├── Multiplier: endorser's trust\_score / 100  
│   ├── Cap: max \+5 per endorsement  
│   └── Formula: min(2 \* (endorser\_trust / 100), 5\)  
├── UPDATE profiles.trust\_score  
├── INSERT into trust\_score\_history  
│   ├── event\_type \= 'endorsement\_received'  
│   ├── delta \= calculated value  
│   └── reason \= "Endorsed for {skill\_tag}"  
└── NOTIFY endorsed user

Step 5: Skill Proficiency Update  
├── Calculate skill proficiency:  
│   ├── Endorsements for skill  
│   ├── Proofs with skill tag  
│   ├── Completed trades using skill  
│   └── Time since last use  
├── Update user's skill\_proficiency JSONB  
│   ├── {skill\_tag}: {  
│   │     level: 1-5,  
│   │     endorsements: count,  
│   │     proofs: count,  
│   │     trades: count,  
│   │     last\_used: timestamp  
│   │   }  
└── Display on profile  
\`\`\`

\#\#\#\# 4.3.3 Review & Rating Workflow  
\`\`\`  
Step 1: Trade Completion Triggers Review  
├── Trade status \= 'completed'  
├── Both parties can submit review  
├── Review window: 30 days  
└── Reminder notifications at 7, 14, 28 days

Step 2: User Submits Review  
├── Navigate to completed trade  
├── Click "Leave Review"  
├── Fill review form:  
│   ├── Rating (1-5 stars, required)  
│   ├── Comment (optional, max 500 chars)  
│   ├── Skill tags validation (checkboxes)  
│   └── Would trade again? (yes/no)  
└── Submit review

Step 3: Validation  
├── Check trade is completed  
├── Check user is trade participant  
├── Check review not already submitted  
├── Validate rating is 1-5  
└── Check comment length

Step 4: Database Operation  
├── INSERT into reviews table  
│   ├── id \= UUID  
│   ├── trade\_id \= completed trade  
│   ├── reviewer\_user\_id \= current user  
│   ├── reviewee\_user\_id \= other party  
│   ├── rating \= 1-5  
│   ├── comment \= review text  
│   ├── skill\_tags\_validated \= array  
│   ├── would\_trade\_again \= boolean  
│   └── created\_at \= now()  
├── Update reviewee's review count  
└── Trigger rating recalculation

Step 5: Average Rating Calculation  
├── Query all reviews for user  
├── Calculate average:  
│   ├── Sum all ratings  
│   ├── Divide by review count  
│   ├── Round to 1 decimal place  
│   └── Weight recent reviews higher  
├── UPDATE profiles.average\_rating  
└── Display on profile

Step 6: Trust Score Impact  
├── Call Edge Function: recalculate-trust-score  
├── Calculate delta based on rating:  
│   ├── 5 stars: \+5 points  
│   ├── 4 stars: \+3 points  
│   ├── 3 stars: \+1 point  
│   ├── 2 stars: \-2 points  
│   └── 1 star: \-5 points  
├── Additional factors:  
│   ├── Reviewer's trust score weight  
│   ├── Trade complexity multiplier  
│   └── Response time bonus/penalty  
├── UPDATE profiles.trust\_score  
├── INSERT into trust\_score\_history  
└── NOTIFY reviewee

Step 7: Mutual Review Bonus  
├── Check if both parties reviewed  
├── If yes:  
│   ├── Bonus: \+2 points each  
│   ├── UPDATE both trust scores  
│   └── NOTIFY both users  
└── Display "Mutual Review" badge  
\`\`\`

\#\#\# 4.4 Dispute Resolution Workflow

\#\#\#\# 4.4.1 Dispute Filing  
\`\`\`  
Step 1: User Files Dispute  
├── Navigate to problematic trade  
├── Click "File Dispute"  
├── Select dispute reason:  
│   ├── Work not delivered  
│   ├── Poor quality  
│   ├── Communication issues  
│   ├── Scope disagreement  
│   └── Other  
└── Provide evidence

Step 2: Fill Dispute Form  
├── Reason (required, dropdown)  
├── Description (required, max 1000 chars)  
├── Evidence upload (optional)  
│   ├── Screenshots  
│   ├── Chat logs  
│   ├── Files  
│   └── Links  
├── Desired resolution (required)  
└── Submit dispute

Step 3: Database Operation  
├── INSERT into disputes table  
│   ├── id \= UUID  
│   ├── trade\_id \= disputed trade  
│   ├── complainant\_user\_id \= filer  
│   ├── respondent\_user\_id \= other party  
│   ├── reason \= selected reason  
│   ├── description \= details  
│   ├── evidence\_urls \= uploaded files  
│   ├── desired\_resolution \= text  
│   ├── status \= 'open'  
│   ├── created\_at \= now()  
│   └── assigned\_admin\_id \= null  
├── UPDATE trades SET status \= 'disputed'  
└── Freeze workspace (read-only)

Step 4: Notification & Assignment  
├── NOTIFY respondent  
│   ├── Type: 'dispute\_filed'  
│   ├── Message: "A dispute has been filed"  
│   └── Email notification  
├── NOTIFY admins  
│   ├── Type: 'new\_dispute'  
│   ├── Priority: high  
│   └── Admin dashboard alert  
├── Auto-assign to available admin  
│   ├── Round-robin assignment  
│   ├── UPDATE disputes.assigned\_admin\_id  
│   └── NOTIFY assigned admin  
└── Set response deadline (48 hours)  
\`\`\`

\#\#\#\# 4.4.2 Dispute Investigation  
\`\`\`  
Step 1: Admin Reviews Dispute  
├── Access admin panel  
├── View dispute details:  
│   ├── Trade information  
│   ├── Both parties' profiles  
│   ├── Trust scores  
│   ├── Chat history  
│   ├── Evidence submitted  
│   └── Previous disputes  
└── Assess severity

Step 2: Gather Information  
├── Request additional evidence  
│   ├── From complainant  
│   ├── From respondent  
│   └── Set submission deadline  
├── Review workspace activity  
│   ├── Message history  
│   ├── File exchanges  
│   ├── Milestone progress  
│   └── Timestamps  
├── Check platform policies  
└── Document findings

Step 3: Respondent Response  
├── NOTIFY respondent to respond  
├── Respondent submits response:  
│   ├── Counter-statement  
│   ├── Evidence  
│   └── Proposed resolution  
├── INSERT into dispute\_responses  
├── NOTIFY complainant of response  
└── Allow rebuttal (optional)

Step 4: Mediation Attempt  
├── Admin facilitates discussion  
├── Create mediation chat channel  
├── Both parties present case  
├── Admin suggests compromise  
├── Track negotiation progress  
└── Set resolution deadline  
\`\`\`

\#\#\#\# 4.4.3 Dispute Resolution  
\`\`\`  
Step 1: Admin Makes Decision  
├── Review all evidence  
├── Consult platform policies  
├── Determine outcome:  
│   ├── Favor complainant  
│   ├── Favor respondent  
│   ├── Partial resolution  
│   └── No fault (misunderstanding)  
└── Document reasoning

Step 2: Resolution Actions  
├── UPDATE disputes table  
│   ├── status \= 'resolved'  
│   ├── resolution \= decision text  
│   ├── resolution\_notes \= reasoning  
│   ├── resolved\_by\_admin\_id \= admin  
│   └── resolved\_at \= now()  
├── UPDATE trades table  
│   ├── status \= outcome status  
│   └── Add resolution note  
└── Execute resolution actions

Step 3: Trust Score Adjustments  
├── If complainant favored:  
│   ├── Complainant: \+3 points  
│   ├── Respondent: \-5 to \-10 points  
│   └── Reason: "Dispute resolved in favor"  
├── If respondent favored:  
│   ├── Respondent: \+2 points  
│   ├── Complainant: \-2 points (false claim)  
│   └── Reason: "Dispute dismissed"  
├── If partial resolution:  
│   ├── Both: \+1 point (cooperation)  
│   └── Reason: "Dispute resolved mutually"  
└── If no fault:  
    ├── Both: no change  
    └── Reason: "Misunderstanding resolved"

Step 4: Notifications  
├── NOTIFY both parties  
│   ├── Type: 'dispute\_resolved'  
│   ├── Include resolution details  
│   ├── Explain trust score changes  
│   └── Email notification  
├── NOTIFY admins  
│   ├── Case closed  
│   └── Update admin metrics  
└── Log in activity feed

Step 5: Post-Resolution  
├── Unlock workspace (if applicable)  
├── Allow final messages  
├── Close trade (if needed)  
├── Update user records  
├── Archive dispute case  
└── Collect feedback on resolution  
\`\`\`

\#\#\# 4.5 Knowledge Base Workflow

\#\#\#\# 4.5.1 Article Creation (Admin)  
\`\`\`  
Step 1: Admin Creates Article  
├── Navigate to Knowledge Base admin  
├── Click "Create Article"  
├── Select category:  
│   ├── Getting Started  
│   ├── Trading Skills  
│   ├── Building Trust  
│   ├── Workspace Collaboration  
│   ├── Dispute Resolution  
│   └── Platform Policies  
└── Open editor

Step 2: Write Article Content  
├── Title (required, max 200 chars)  
├── Rich text editor:  
│   ├── Headings (H2, H3, H4)  
│   ├── Paragraphs  
│   ├── Lists (ordered, unordered)  
│   ├── Code blocks  
│   ├── Blockquotes  
│   ├── Links  
│   └── Images  
├── SEO metadata:  
│   ├── Meta description  
│   ├── Keywords  
│   └── Slug (auto-generated)  
└── Related articles (optional)

Step 3: Preview & Validation  
├── Preview article rendering  
├── Check formatting  
├── Validate links  
├── Test code examples  
└── Review readability

Step 4: Database Operation  
├── INSERT into knowledge\_base\_articles  
│   ├── id \= UUID  
│   ├── title \= article title  
│   ├── content \= HTML content  
│   ├── category \= selected category  
│   ├── author\_user\_id \= admin  
│   ├── status \= 'draft' or 'published'  
│   ├── slug \= URL-friendly title  
│   ├── meta\_description \= SEO text  
│   ├── keywords \= array of keywords  
│   ├── created\_at \= now()  
│   └── updated\_at \= now()  
├── Index for search  
└── Generate table of contents

Step 5: Publishing  
├── If status \= 'published':  
│   ├── Make visible to all users  
│   ├── Add to category listing  
│   ├── Update sitemap  
│   ├── NOTIFY subscribers (if any)  
│   └── Post to activity feed  
└── If status \= 'draft':  
    ├── Only visible to admins  
    └── Can preview and edit  
\`\`\`

\#\#\#\# 4.5.2 Article Discovery & Reading  
\`\`\`  
Step 1: User Accesses Knowledge Base  
├── Navigate to "Knowledge Base"  
├── View categories:  
│   ├── Display category cards  
│   ├── Show article count per category  
│   └── Featured articles  
└── Search bar available

Step 2: Browse or Search  
├── Option A: Browse by category  
│   ├── Click category card  
│   ├── View articles in category  
│   ├── Sort by: newest, popular, title  
│   └── Pagination (20 per page)  
└── Option B: Search  
    ├── Enter search query  
    ├── Full-text search in titles & content  
    ├── Filter by category  
    └── Display results with highlights

Step 3: View Article  
├── Click article title  
├── Load article content  
├── Display:  
│   ├── Title  
│   ├── Author & date  
│   ├── Table of contents (if long)  
│   ├── Article content (formatted)  
│   ├── Related articles  
│   └── Feedback buttons  
└── Track view count

Step 4: Article Interaction  
├── Read article content  
├── Click internal links  
├── Copy code examples  
├── Provide feedback:  
│   ├── "Was this helpful?" (yes/no)  
│   ├── Optional comment  
│   └── Submit feedback  
└── Share article (copy link)

Step 5: Feedback Processing  
├── INSERT into article\_feedback  
│   ├── article\_id \= current article  
│   ├── user\_id \= current user  
│   ├── helpful \= boolean  
│   ├── comment \= optional text  
│   └── created\_at \= now()  
├── Update article helpfulness score  
├── NOTIFY author if comment provided  
└── Use for article improvement  
\`\`\`

\#\#\# 4.6 Analytics & Reporting Workflow

\#\#\#\# 4.6.1 Dashboard Metrics Calculation  
\`\`\`  
Step 1: User Views Dashboard  
├── Navigate to "Dashboard"  
├── Trigger data fetch  
└── Display loading state

Step 2: Fetch KPI Data  
├── Query 1: Total Proofs  
│   ├── SELECT COUNT(\*) FROM proofs  
│   ├── WHERE user\_id \= current\_user  
│   └── Result: total\_proofs  
├── Query 2: Active Trades  
│   ├── SELECT COUNT(\*) FROM trades  
│   ├── WHERE (requester\_user\_id \= current\_user  
│   │         OR owner\_user\_id \= current\_user)  
│   ├── AND status IN ('pending', 'accepted', 'in\_progress')  
│   └── Result: active\_trades  
├── Query 3: Trust Score  
│   ├── SELECT trust\_score FROM profiles  
│   ├── WHERE id \= current\_user  
│   └── Result: trust\_score  
└── Query 4: Completed Trades  
    ├── SELECT COUNT(\*) FROM trades  
    ├── WHERE (requester\_user\_id \= current\_user  
    │         OR owner\_user\_id \= current\_user)  
    ├── AND status \= 'completed'  
    └── Result: completed\_trades

Step 3: Calculate Trends  
├── For each metric:  
│   ├── Fetch previous period data  
│   ├── Calculate change:  
│   │   ├── delta \= current \- previous  
│   │   ├── percentage \= (delta / previous) \* 100  
│   │   └── trend \= 'up' or 'down'  
│   └── Format for display  
└── Cache results (5 minutes)

Step 4: Render Dashboard  
├── Display KPI cards:  
│   ├── Total Proofs (with trend)  
│   ├── Active Trades (with trend)  
│   ├── Trust Score (with change)  
│   └── Completed Trades (with trend)  
├── Activity feed (recent 10 items)  
├── Quick actions:  
│   ├── Create Listing  
│   ├── Browse Market  
│   └── View ProofChain  
└── Onboarding checklist (if incomplete)  
\`\`\`

\#\#\#\# 4.6.2 Analytics Dashboard (Admin)  
\`\`\`  
Step 1: Admin Accesses Analytics  
├── Navigate to "Analytics"  
├── Verify admin role  
└── Load analytics dashboard

Step 2: Platform Statistics  
├── Query platform-wide metrics:  
│   ├── Total users (active, inactive)  
│   ├── Total listings (active, completed)  
│   ├── Total trades (by status)  
│   ├── Total workspaces  
│   ├── Total proofs  
│   ├── Average trust score  
│   └── Total disputes (open, resolved)  
├── Calculate growth rates  
└── Display in metric cards

Step 3: Time-Series Data  
├── Fetch historical data:  
│   ├── User registrations per day/week/month  
│   ├── Trades created per day/week/month  
│   ├── Trades completed per day/week/month  
│   ├── Revenue per day/week/month (if applicable)  
│   └── Active users per day/week/month  
├── Generate chart data  
└── Render line/bar charts

Step 4: User Segmentation  
├── Segment users by:  
│   ├── DNA type (Builder, Thinker, Connector, Visionary)  
│   ├── Trust score ranges  
│   ├── Activity level (active, moderate, inactive)  
│   ├── Registration date (cohorts)  
│   └── Geographic location (if available)  
├── Calculate segment sizes  
└── Display pie/donut charts

Step 5: Engagement Metrics  
├── Calculate:  
│   ├── Daily Active Users (DAU)  
│   ├── Weekly Active Users (WAU)  
│   ├── Monthly Active Users (MAU)  
│   ├── DAU/MAU ratio (stickiness)  
│   ├── Average session duration  
│   ├── Average trades per user  
│   └── Retention rate (cohort analysis)  
├── Compare to previous periods  
└── Display trends

Step 6: Export & Reporting  
├── Export options:  
│   ├── CSV (raw data)  
│   ├── PDF (formatted report)  
│   └── Excel (with charts)  
├── Schedule automated reports  
├── Email to stakeholders  
└── Archive reports  
\`\`\`

\---

\#\# 5\. Data Models and Relationships

\#\#\# 5.1 Core Entities

\#\#\#\# 5.1.1 Profile Entity  
\`\`\`typescript  
interface Profile {  
  id: string; // UUID, primary key  
  email: string; // Unique, indexed  
  mononym: string; // Unique username, indexed  
  full\_name: string;  
  avatar\_url: string | null;  
  bio: string | null;  
  dna\_type: 'Builder' | 'Thinker' | 'Connector' | 'Visionary';  
  skill\_tags: string\[\]; // Array of skill identifiers  
  trust\_score: number; // 0-100, default 50  
  average\_rating: number | null; // 0-5, calculated from reviews  
  role: 'user' | 'admin' | 'owner';  
  notification\_preferences: Record\<string, boolean\>;  
  referred\_by: string | null; // UUID of referrer  
  created\_at: string; // ISO timestamp  
  updated\_at: string; // ISO timestamp  
}  
\`\`\`

\*\*Relationships:\*\*  
\- One-to-Many: Profile → Listings (owner)  
\- One-to-Many: Profile → Trades (requester)  
\- One-to-Many: Profile → Trades (owner)  
\- One-to-Many: Profile → Proofs  
\- One-to-Many: Profile → Endorsements (endorser)  
\- One-to-Many: Profile → Endorsements (endorsed)  
\- One-to-Many: Profile → Workspaces (owner)  
\- Many-to-Many: Profile ↔ Workspaces (via workspace\_members)

\#\#\#\# 5.1.2 Listing Entity  
\`\`\`typescript  
interface Listing {  
  id: string; // UUID, primary key  
  owner\_user\_id: string; // Foreign key to profiles  
  title: string; // Max 100 chars  
  description: string; // Max 1000 chars  
  skill\_offered: string; // Skill tag  
  skill\_wanted: string; // Skill tag  
  duration\_hours: number; // Estimated hours  
  status: 'active' | 'in\_progress' | 'completed' | 'expired' | 'cancelled';  
  expires\_at: string | null; // ISO timestamp  
  created\_at: string; // ISO timestamp  
  updated\_at: string; // ISO timestamp  
}  
\`\`\`

\*\*Relationships:\*\*  
\- Many-to-One: Listing → Profile (owner)  
\- One-to-Many: Listing → Trades

\*\*Business Rules:\*\*  
\- \`status\` transitions: active → in\_progress → completed  
\- \`expires\_at\` must be \> \`created\_at\`  
\- \`skill\_offered\` ≠ \`skill\_wanted\`  
\- \`duration\_hours\` \> 0

\#\#\#\# 5.1.3 Trade Entity  
\`\`\`typescript  
interface Trade {  
  id: string; // UUID, primary key  
  listing\_id: string; // Foreign key to listings  
  requester\_user\_id: string; // Foreign key to profiles  
  owner\_user\_id: string; // Foreign key to profiles  
  status: 'pending' | 'accepted' | 'rejected' | 'counter\_offered' |   
          'in\_progress' | 'completed' | 'cancelled' | 'disputed';  
  proposed\_hours: number;  
  message: string; // Initial proposal message  
  counter\_offer\_message: string | null;  
  workspace\_id: string | null; // Foreign key to workspaces  
  created\_at: string; // ISO timestamp  
  updated\_at: string; // ISO timestamp  
}  
\`\`\`

\*\*Relationships:\*\*  
\- Many-to-One: Trade → Listing  
\- Many-to-One: Trade → Profile (requester)  
\- Many-to-One: Trade → Profile (owner)  
\- One-to-One: Trade → Workspace (optional)  
\- One-to-Many: Trade → Reviews  
\- One-to-One: Trade → Dispute (optional)

\*\*State Machine:\*\*  
\`\`\`  
pending → accepted → in\_progress → completed  
   ↓         ↓            ↓  
rejected  cancelled   disputed  
   ↓                      ↓  
counter\_offered      resolved → completed  
\`\`\`

\#\#\#\# 5.1.4 Workspace Entity  
\`\`\`typescript  
interface Workspace {  
  id: string; // UUID, primary key  
  name: string; // Max 100 chars  
  description: string | null;  
  owner\_user\_id: string; // Foreign key to profiles  
  status: 'active' | 'archived';  
  trade\_id: string | null; // Foreign key to trades (if trade workspace)  
  created\_at: string; // ISO timestamp  
  updated\_at: string; // ISO timestamp  
  last\_activity\_at: string; // ISO timestamp  
}

interface WorkspaceMember {  
  workspace\_id: string; // Foreign key to workspaces  
  user\_id: string; // Foreign key to profiles  
  role: 'owner' | 'member';  
  joined\_at: string; // ISO timestamp  
}

interface WorkspaceMessage {  
  id: string; // UUID, primary key  
  workspace\_id: string; // Foreign key to workspaces  
  user\_id: string; // Foreign key to profiles  
  message: string;  
  attachments: Array\<{  
    name: string;  
    url: string;  
    size: number;  
    type: string;  
  }\> | null;  
  mentions: string\[\] | null; // Array of user IDs  
  created\_at: string; // ISO timestamp  
}  
\`\`\`

\*\*Relationships:\*\*  
\- Many-to-One: Workspace → Profile (owner)  
\- One-to-One: Workspace → Trade (optional)  
\- Many-to-Many: Workspace ↔ Profile (via workspace\_members)  
\- One-to-Many: Workspace → WorkspaceMessage

\#\#\#\# 5.1.5 Proof Entity  
\`\`\`typescript  
interface Proof {  
  id: string; // UUID, primary key  
  user\_id: string; // Foreign key to profiles  
  title: string; // Max 100 chars  
  description: string; // Max 1000 chars  
  proof\_type: 'project' | 'trade' | 'certification' | 'achievement';  
  media\_urls: string\[\]; // Array of storage URLs  
  skill\_tags: string\[\]; // Array of skill identifiers  
  visibility: 'public' | 'private' | 'connections';  
  trade\_id: string | null; // Foreign key to trades (if from trade)  
  created\_at: string; // ISO timestamp  
  updated\_at: string; // ISO timestamp  
}  
\`\`\`

\*\*Relationships:\*\*  
\- Many-to-One: Proof → Profile  
\- Many-to-One: Proof → Trade (optional)

\#\#\#\# 5.1.6 Review Entity  
\`\`\`typescript  
interface Review {  
  id: string; // UUID, primary key  
  trade\_id: string; // Foreign key to trades  
  reviewer\_user\_id: string; // Foreign key to profiles  
  reviewee\_user\_id: string; // Foreign key to profiles  
  rating: number; // 1-5  
  comment: string | null; // Max 500 chars  
  skill\_tags\_validated: string\[\]; // Skills confirmed  
  would\_trade\_again: boolean;  
  created\_at: string; // ISO timestamp  
}  
\`\`\`

\*\*Relationships:\*\*  
\- Many-to-One: Review → Trade  
\- Many-to-One: Review → Profile (reviewer)  
\- Many-to-One: Review → Profile (reviewee)

\*\*Constraints:\*\*  
\- Unique: (trade\_id, reviewer\_user\_id)  
\- \`rating\` between 1 and 5  
\- \`reviewer\_user\_id\` ≠ \`reviewee\_user\_id\`

\#\#\#\# 5.1.7 Endorsement Entity  
\`\`\`typescript  
interface Endorsement {  
  id: string; // UUID, primary key  
  endorser\_user\_id: string; // Foreign key to profiles  
  endorsed\_user\_id: string; // Foreign key to profiles  
  skill\_tag: string; // Skill being endorsed  
  message: string | null; // Max 200 chars  
  created\_at: string; // ISO timestamp  
}  
\`\`\`

\*\*Relationships:\*\*  
\- Many-to-One: Endorsement → Profile (endorser)  
\- Many-to-One: Endorsement → Profile (endorsed)

\*\*Constraints:\*\*  
\- Unique: (endorser\_user\_id, endorsed\_user\_id, skill\_tag)  
\- \`endorser\_user\_id\` ≠ \`endorsed\_user\_id\`

\#\#\#\# 5.1.8 Dispute Entity  
\`\`\`typescript  
interface Dispute {  
  id: string; // UUID, primary key  
  trade\_id: string; // Foreign key to trades  
  complainant\_user\_id: string; // Foreign key to profiles  
  respondent\_user\_id: string; // Foreign key to profiles  
  reason: 'work\_not\_delivered' | 'poor\_quality' |   
          'communication\_issues' | 'scope\_disagreement' | 'other';  
  description: string; // Max 1000 chars  
  evidence\_urls: string\[\]; // Array of storage URLs  
  desired\_resolution: string;  
  status: 'open' | 'investigating' | 'resolved' | 'closed';  
  assigned\_admin\_id: string | null; // Foreign key to profiles  
  resolution: string | null;  
  resolution\_notes: string | null;  
  resolved\_by\_admin\_id: string | null; // Foreign key to profiles  
  resolved\_at: string | null; // ISO timestamp  
  created\_at: string; // ISO timestamp  
  updated\_at: string; // ISO timestamp  
}  
\`\`\`

\*\*Relationships:\*\*  
\- One-to-One: Dispute → Trade  
\- Many-to-One: Dispute → Profile (complainant)  
\- Many-to-One: Dispute → Profile (respondent)  
\- Many-to-One: Dispute → Profile (assigned admin)  
\- Many-to-One: Dispute → Profile (resolved by admin)

\#\#\# 5.2 Supporting Entities

\#\#\#\# 5.2.1 Notification Entity  
\`\`\`typescript  
interface Notification {  
  id: string; // UUID, primary key  
  user\_id: string; // Foreign key to profiles  
  type: 'trade\_proposal' | 'trade\_accepted' | 'trade\_completed' |  
        'review\_received' | 'endorsement\_received' | 'workspace\_mention' |  
        'dispute\_filed' | 'dispute\_resolved' | 'trust\_score\_change' |  
        'system\_announcement';  
  title: string;  
  message: string;  
  related\_id: string | null; // ID of related entity  
  related\_type: string | null; // Type of related entity  
  read: boolean; // Default false  
  created\_at: string; // ISO timestamp  
}  
\`\`\`

\#\#\#\# 5.2.2 Activity Feed Entity  
\`\`\`typescript  
interface ActivityFeed {  
  id: string; // UUID, primary key  
  user\_id: string; // Foreign key to profiles (recipient)  
  actor\_user\_id: string; // Foreign key to profiles (actor)  
  action: 'created\_listing' | 'proposed\_trade' | 'accepted\_trade' |  
          'completed\_trade' | 'added\_proof' | 'gave\_endorsement' |  
          'left\_review' | 'joined\_workspace';  
  related\_id: string | null; // ID of related entity  
  related\_type: string | null; // Type of related entity  
  metadata: Record\<string, any\> | null; // Additional data  
  created\_at: string; // ISO timestamp  
}  
\`\`\`

\#\#\#\# 5.2.3 Trust Score History Entity  
\`\`\`typescript  
interface TrustScoreHistory {  
  id: string; // UUID, primary key  
  user\_id: string; // Foreign key to profiles  
  event\_type: 'trade\_completed' | 'review\_received' | 'endorsement\_received' |  
              'dispute\_resolved' | 'referral\_bonus' | 'admin\_adjustment';  
  delta: number; // Change in trust score (can be negative)  
  reason: string; // Explanation of change  
  related\_id: string | null; // ID of related entity  
  created\_at: string; // ISO timestamp  
}  
\`\`\`

\#\#\#\# 5.2.4 Knowledge Base Article Entity  
\`\`\`typescript  
interface KnowledgeBaseArticle {  
  id: string; // UUID, primary key  
  title: string; // Max 200 chars  
  content: string; // HTML content  
  category: 'getting\_started' | 'trading\_skills' | 'building\_trust' |  
            'workspace\_collaboration' | 'dispute\_resolution' | 'platform\_policies';  
  author\_user\_id: string; // Foreign key to profiles  
  status: 'draft' | 'published' | 'archived';  
  slug: string; // URL-friendly title, unique  
  meta\_description: string | null;  
  keywords: string\[\] | null;  
  view\_count: number; // Default 0  
  helpful\_count: number; // Default 0  
  created\_at: string; // ISO timestamp  
  updated\_at: string; // ISO timestamp  
  published\_at: string | null; // ISO timestamp  
}  
\`\`\`

\#\#\# 5.3 Database Indexes

\`\`\`sql  
\-- Performance-critical indexes  
CREATE INDEX idx\_listings\_owner ON listings(owner\_user\_id);  
CREATE INDEX idx\_listings\_status ON listings(status);  
CREATE INDEX idx\_listings\_expires\_at ON listings(expires\_at);  
CREATE INDEX idx\_listings\_skill\_offered ON listings(skill\_offered);  
CREATE INDEX idx\_listings\_skill\_wanted ON listings(skill\_wanted);

CREATE INDEX idx\_trades\_listing ON trades(listing\_id);  
CREATE INDEX idx\_trades\_requester ON trades(requester\_user\_id);  
CREATE INDEX idx\_trades\_owner ON trades(owner\_user\_id);  
CREATE INDEX idx\_trades\_status ON trades(status);  
CREATE INDEX idx\_trades\_created\_at ON trades(created\_at DESC);

CREATE INDEX idx\_proofs\_user ON proofs(user\_id);  
CREATE INDEX idx\_proofs\_visibility ON proofs(visibility);  
CREATE INDEX idx\_proofs\_created\_at ON proofs(created\_at DESC);

CREATE INDEX idx\_reviews\_trade ON reviews(trade\_id);  
CREATE INDEX idx\_reviews\_reviewee ON reviews(reviewee\_user\_id);

CREATE INDEX idx\_endorsements\_endorsed ON endorsements(endorsed\_user\_id);  
CREATE INDEX idx\_endorsements\_skill ON endorsements(skill\_tag);

CREATE INDEX idx\_notifications\_user ON notifications(user\_id);  
CREATE INDEX idx\_notifications\_read ON notifications(read);  
CREATE INDEX idx\_notifications\_created\_at ON notifications(created\_at DESC);

CREATE INDEX idx\_workspace\_messages\_workspace ON workspace\_messages(workspace\_id);  
CREATE INDEX idx\_workspace\_messages\_created\_at ON workspace\_messages(created\_at DESC);

CREATE INDEX idx\_disputes\_trade ON disputes(trade\_id);  
CREATE INDEX idx\_disputes\_status ON disputes(status);  
CREATE INDEX idx\_disputes\_assigned\_admin ON disputes(assigned\_admin\_id);  
\`\`\`

\---

\#\# 6\. Business Logic and Rules

\#\#\# 6.1 Trust Score Calculation

\#\#\#\# 6.1.1 Initial Trust Score  
\- New users start with trust\_score \= 50  
\- Range: 0-100  
\- Cannot go below 0 or above 100

\#\#\#\# 6.1.2 Trust Score Events

| Event | Delta | Conditions |  
|-------|-------|------------|  
| Complete first trade | \+5 | First completed trade |  
| Complete trade (5-star review) | \+5 | Rating \= 5 |  
| Complete trade (4-star review) | \+3 | Rating \= 4 |  
| Complete trade (3-star review) | \+1 | Rating \= 3 |  
| Complete trade (2-star review) | \-2 | Rating \= 2 |  
| Complete trade (1-star review) | \-5 | Rating \= 1 |  
| Receive endorsement | \+2 to \+5 | Based on endorser's trust score |  
| Mutual review bonus | \+2 | Both parties review each other |  
| Referral bonus | \+5 | New user signs up with referral code |  
| Dispute resolved (favored) | \+3 | Dispute resolved in user's favor |  
| Dispute resolved (against) | \-5 to \-10 | Dispute resolved against user |  
| False dispute claim | \-2 | Dispute dismissed as invalid |  
| Response time bonus | \+1 | Respond to trade within 24 hours |  
| Late response penalty | \-1 | No response for 7+ days |  
| Admin adjustment | Variable | Manual adjustment by admin |

\#\#\#\# 6.1.3 Trust Score Calculation Formula  
\`\`\`typescript  
function calculateTrustScoreDelta(event: TrustScoreEvent): number {  
  let delta \= 0;  
    
  switch (event.type) {  
    case 'review\_received':  
      // Base delta from rating  
      const ratingDeltas \= { 5: 5, 4: 3, 3: 1, 2: \-2, 1: \-5 };  
      delta \= ratingDeltas\[event.rating\];  
        
      // Multiplier based on reviewer's trust score  
      const reviewerWeight \= event.reviewerTrustScore / 100;  
      delta \= Math.round(delta \* reviewerWeight);  
        
      // Trade complexity multiplier  
      if (event.tradeHours \> 20\) {  
        delta \= Math.round(delta \* 1.5);  
      }  
      break;  
        
    case 'endorsement\_received':  
      // Base delta  
      delta \= 2;  
        
      // Multiplier based on endorser's trust score  
      const endorserWeight \= event.endorserTrustScore / 100;  
      delta \= Math.min(Math.round(delta \* endorserWeight), 5);  
      break;  
        
    case 'dispute\_resolved':  
      if (event.outcome \=== 'favored') {  
        delta \= 3;  
      } else if (event.outcome \=== 'against') {  
        // Severity based on dispute reason  
        const severityDeltas \= {  
          work\_not\_delivered: \-10,  
          poor\_quality: \-7,  
          communication\_issues: \-5,  
          scope\_disagreement: \-5,  
          other: \-5  
        };  
        delta \= severityDeltas\[event.reason\];  
      }  
      break;  
        
    // ... other event types  
  }  
    
  return delta;  
}  
\`\`\`

\#\#\# 6.2 Listing Expiration Rules

\#\#\#\# 6.2.1 Automatic Expiration  
\- Listings expire after \`expires\_at\` timestamp  
\- Daily cron job checks for expired listings  
\- Expired listings: status \= 'expired'  
\- Expired listings removed from search results  
\- Owner notified 3 days before expiration

\#\#\#\# 6.2.2 Expiration Extension  
\- Owner can extend expiration date  
\- Maximum extension: 90 days from creation  
\- Extension resets listing to 'active' status  
\- Extension logged in activity feed

\#\#\# 6.3 Trade Status Transitions

\#\#\#\# 6.3.1 Valid Transitions  
\`\`\`  
pending → accepted (owner accepts)  
pending → rejected (owner rejects)  
pending → counter\_offered (owner counters)  
counter\_offered → accepted (requester accepts counter)  
counter\_offered → rejected (requester rejects counter)  
accepted → in\_progress (work begins)  
in\_progress → completed (both parties confirm)  
in\_progress → disputed (dispute filed)  
disputed → resolved (admin resolves)  
resolved → completed (if resolution successful)  
any → cancelled (mutual agreement or admin action)  
\`\`\`

\#\#\#\# 6.3.2 Transition Permissions  
\- \`pending → accepted/rejected/counter\_offered\`: Owner only  
\- \`counter\_offered → accepted/rejected\`: Requester only  
\- \`accepted → in\_progress\`: Either party  
\- \`in\_progress → completed\`: Both parties must confirm  
\- \`in\_progress → disputed\`: Either party  
\- \`disputed → resolved\`: Admin only  
\- \`any → cancelled\`: Both parties agree OR admin

\#\#\# 6.4 Workspace Rules

\#\#\#\# 6.4.1 Workspace Creation  
\- Any user can create workspace  
\- Owner automatically added as member with role 'owner'  
\- Trade-linked workspaces auto-created on trade acceptance  
\- Trade-linked workspaces include both trade parties

\#\#\#\# 6.4.2 Member Management  
\- Owner can invite/remove members  
\- Owner can promote members to owner (transfers ownership)  
\- Members can leave workspace (except owner)  
\- Removing last member archives workspace

\#\#\#\# 6.4.3 Message Rules  
\- Only members can send messages  
\- Messages cannot be edited (append-only)  
\- Messages can be deleted by sender or owner  
\- Deleted messages show "\[Message deleted\]"  
\- File attachments limited to 10MB per file  
\- Maximum 5 attachments per message

\#\#\# 6.5 Review & Rating Rules

\#\#\#\# 6.5.1 Review Eligibility  
\- Only trade participants can review  
\- Can only review after trade status \= 'completed'  
\- Each user can submit one review per trade  
\- Review window: 30 days after completion  
\- Late reviews accepted but flagged

\#\#\#\# 6.5.2 Rating Calculation  
\`\`\`typescript  
function calculateAverageRating(userId: string): number {  
  const reviews \= getReviewsForUser(userId);  
    
  if (reviews.length \=== 0\) return null;  
    
  // Weight recent reviews higher  
  const now \= Date.now();  
  const weightedSum \= reviews.reduce((sum, review) \=\> {  
    const ageInDays \= (now \- review.created\_at) / (1000 \* 60 \* 60 \* 24);  
    const weight \= Math.max(1, 1 / (1 \+ ageInDays / 365)); // Decay over 1 year  
    return sum \+ (review.rating \* weight);  
  }, 0);  
    
  const totalWeight \= reviews.reduce((sum, review) \=\> {  
    const ageInDays \= (now \- review.created\_at) / (1000 \* 60 \* 60 \* 24);  
    const weight \= Math.max(1, 1 / (1 \+ ageInDays / 365));  
    return sum \+ weight;  
  }, 0);  
    
  return Math.round((weightedSum / totalWeight) \* 10\) / 10; // Round to 1 decimal  
}  
\`\`\`

\#\#\# 6.6 Dispute Rules

\#\#\#\# 6.6.1 Filing Eligibility  
\- Only trade participants can file dispute  
\- Can only file after trade status \= 'accepted' or 'in\_progress'  
\- Cannot file if trade already completed  
\- One dispute per trade maximum

\#\#\#\# 6.6.2 Dispute Timeline  
\- Respondent has 48 hours to respond  
\- Admin assigned within 24 hours  
\- Investigation period: 5-7 business days  
\- Resolution communicated within 24 hours of decision

\#\#\#\# 6.6.3 Resolution Outcomes  
\- \*\*Favor Complainant\*\*: Trade cancelled, complainant \+3 trust, respondent \-5 to \-10 trust  
\- \*\*Favor Respondent\*\*: Trade continues or cancelled, respondent \+2 trust, complainant \-2 trust  
\- \*\*Partial Resolution\*\*: Compromise reached, both \+1 trust for cooperation  
\- \*\*No Fault\*\*: Misunderstanding, no trust score changes

\#\#\# 6.7 Notification Rules

\#\#\#\# 6.7.1 Notification Types & Triggers

| Type | Trigger | Recipients | Channels |  
|------|---------|------------|----------|  
| trade\_proposal | Trade created | Listing owner | In-app, Email |  
| trade\_accepted | Trade accepted | Requester | In-app, Email |  
| trade\_rejected | Trade rejected | Requester | In-app |  
| trade\_completed | Trade completed | Both parties | In-app, Email |  
| review\_received | Review submitted | Reviewee | In-app, Email |  
| endorsement\_received | Endorsement given | Endorsed user | In-app |  
| workspace\_mention | User mentioned in message | Mentioned user | In-app, Push |  
| workspace\_message | New message in workspace | All members (except sender) | In-app |  
| dispute\_filed | Dispute created | Respondent, Admins | In-app, Email |  
| dispute\_resolved | Dispute resolved | Both parties | In-app, Email |  
| trust\_score\_change | Trust score updated | User | In-app |  
| listing\_expiring | Listing expires in 3 days | Listing owner | In-app, Email |  
| system\_announcement | Admin announcement | All users or segment | In-app, Email |

\#\#\#\# 6.7.2 Notification Preferences  
\- Users can toggle each notification type  
\- Preferences stored in \`profiles.notification\_preferences\`  
\- Default: all enabled except system\_announcement  
\- Cannot disable critical notifications (dispute\_filed, dispute\_resolved)

\#\#\# 6.8 Search & Discovery Rules

\#\#\#\# 6.8.1 Listing Search  
\- Full-text search on title and description  
\- Filter by:  
  \- Skill offered  
  \- Skill wanted  
  \- Duration hours (range)  
  \- Owner trust score (minimum)  
  \- Expiration date (range)  
\- Sort by:  
  \- Relevance (default)  
  \- Newest first  
  \- Expiring soon  
  \- Owner trust score (highest first)

\#\#\#\# 6.8.2 User Search  
\- Search by mononym or full name  
\- Filter by:  
  \- DNA type  
  \- Skill tags  
  \- Trust score (minimum)  
  \- Average rating (minimum)  
\- Sort by:  
  \- Relevance (default)  
  \- Trust score (highest first)  
  \- Average rating (highest first)  
  \- Most endorsed

\#\#\#\# 6.8.3 ProofChain Discovery  
\- Public proofs visible to all  
\- Private proofs visible to owner only  
\- Connections proofs visible to:  
  \- Users who endorsed the owner  
  \- Users who traded with the owner  
\- Filter by:  
  \- Proof type  
  \- Skill tags  
  \- Date range  
\- Sort by:  
  \- Newest first (default)  
  \- Most viewed

\---

\#\# 7\. Integration Points

\#\#\# 7.1 Supabase Edge Functions

\#\#\#\# 7.1.1 notify-trade-proposal  
\*\*Trigger:\*\* Database trigger on \`trades\` INSERT    
\*\*Purpose:\*\* Send notifications when trade proposal submitted

\*\*Workflow:\*\*  
\`\`\`typescript  
1\. Receive trade\_id from trigger  
2\. Fetch trade details (requester, owner, listing)  
3\. Insert notification for owner  
4\. Insert activity\_feed entry  
5\. Send email notification (if enabled)  
6\. Return success/error  
\`\`\`

\#\#\#\# 7.1.2 recalculate-trust-score  
\*\*Trigger:\*\* Manual call from application    
\*\*Purpose:\*\* Recalculate user's trust score after events

\*\*Workflow:\*\*  
\`\`\`typescript  
1\. Receive user\_id and event details  
2\. Calculate delta using formula  
3\. Fetch current trust\_score  
4\. Apply delta (clamp to 0-100)  
5\. UPDATE profiles.trust\_score  
6\. INSERT into trust\_score\_history  
7\. Send notification if significant change (±5)  
8\. Return new trust\_score  
\`\`\`

\#\#\#\# 7.1.3 process-stripe-payment  
\*\*Trigger:\*\* Stripe webhook    
\*\*Purpose:\*\* Handle payment events (future feature)

\*\*Workflow:\*\*  
\`\`\`typescript  
1\. Verify webhook signature  
2\. Parse event type  
3\. Handle event:  
   \- payment\_intent.succeeded  
   \- payment\_intent.failed  
   \- subscription.created  
   \- subscription.cancelled  
4\. Update database records  
5\. Send confirmation notification  
6\. Return 200 OK  
\`\`\`

\#\#\# 7.2 Supabase Realtime

\#\#\#\# 7.2.1 Workspace Messages  
\*\*Channel:\*\* \`workspace:{workspace\_id}\`    
\*\*Events:\*\* INSERT on \`workspace\_messages\`

\*\*Client Subscription:\*\*  
\`\`\`typescript  
const channel \= supabase  
  .channel(\`workspace:${workspaceId}\`)  
  .on(  
    'postgres\_changes',  
    {  
      event: 'INSERT',  
      schema: 'public',  
      table: 'workspace\_messages',  
      filter: \`workspace\_id=eq.${workspaceId}\`  
    },  
    (payload) \=\> {  
      // Add message to UI  
      addMessageToChat(payload.new);  
    }  
  )  
  .subscribe();  
\`\`\`

\#\#\#\# 7.2.2 Notifications  
\*\*Channel:\*\* \`notifications:{user\_id}\`    
\*\*Events:\*\* INSERT on \`notifications\`

\*\*Client Subscription:\*\*  
\`\`\`typescript  
const channel \= supabase  
  .channel(\`notifications:${userId}\`)  
  .on(  
    'postgres\_changes',  
    {  
      event: 'INSERT',  
      schema: 'public',  
      table: 'notifications',  
      filter: \`user\_id=eq.${userId}\`  
    },  
    (payload) \=\> {  
      // Show notification toast  
      showNotificationToast(payload.new);  
      // Update notification badge  
      incrementNotificationBadge();  
    }  
  )  
  .subscribe();  
\`\`\`

\#\#\# 7.3 Stripe Integration

\#\#\#\# 7.3.1 Payment Processing (Future)  
\- Subscription plans (Basic, Pro, Enterprise)  
\- One-time payments for premium features  
\- Webhook handling for payment events  
\- Invoice generation and management

\#\#\#\# 7.3.2 Payout System (Future)  
\- Connect accounts for users  
\- Automated payouts for completed trades  
\- Fee calculation and distribution  
\- Tax reporting (1099 forms)

\#\#\# 7.4 Email Service

\#\#\#\# 7.4.1 Transactional Emails  
\- Welcome email (registration)  
\- Email verification  
\- Password reset  
\- Trade proposal notification  
\- Trade accepted notification  
\- Review reminder  
\- Dispute notification  
\- Weekly activity digest

\#\#\#\# 7.4.2 Email Templates  
\- Responsive HTML templates  
\- Personalization variables  
\- Unsubscribe links  
\- Tracking pixels (open rates)

\---

\#\# 8\. Security and Privacy

\#\#\# 8.1 Authentication Security

\#\#\#\# 8.1.1 Password Requirements  
\- Minimum 8 characters  
\- At least 1 uppercase letter  
\- At least 1 lowercase letter  
\- At least 1 number  
\- At least 1 special character (optional)  
\- Cannot contain email or mononym  
\- Password strength meter displayed

\#\#\#\# 8.1.2 Session Management  
\- JWT tokens with 30-day expiration  
\- Refresh tokens for extended sessions  
\- Secure httpOnly cookies  
\- CSRF protection  
\- Session invalidation on password change  
\- Multi-device session tracking

\#\#\#\# 8.1.3 Two-Factor Authentication (Future)  
\- TOTP (Time-based One-Time Password)  
\- SMS verification  
\- Backup codes  
\- Trusted devices

\#\#\# 8.2 Row Level Security (RLS)

\#\#\#\# 8.2.1 Profiles Table  
\`\`\`sql  
\-- Users can view all public profiles  
CREATE POLICY "Public profiles are viewable by everyone"  
  ON profiles FOR SELECT  
  USING (true);

\-- Users can update only their own profile  
CREATE POLICY "Users can update own profile"  
  ON profiles FOR UPDATE  
  USING (auth.uid() \= id);  
\`\`\`

\#\#\#\# 8.2.2 Listings Table  
\`\`\`sql  
\-- Anyone can view active listings  
CREATE POLICY "Active listings are viewable by everyone"  
  ON listings FOR SELECT  
  USING (status \= 'active' OR owner\_user\_id \= auth.uid());

\-- Users can create listings  
CREATE POLICY "Users can create listings"  
  ON listings FOR INSERT  
  WITH CHECK (auth.uid() \= owner\_user\_id);

\-- Users can update own listings  
CREATE POLICY "Users can update own listings"  
  ON listings FOR UPDATE  
  USING (auth.uid() \= owner\_user\_id);  
\`\`\`

\#\#\#\# 8.2.3 Trades Table  
\`\`\`sql  
\-- Users can view trades they're involved in  
CREATE POLICY "Users can view own trades"  
  ON trades FOR SELECT  
  USING (  
    auth.uid() \= requester\_user\_id OR  
    auth.uid() \= owner\_user\_id  
  );

\-- Users can create trade proposals  
CREATE POLICY "Users can create trades"  
  ON trades FOR INSERT  
  WITH CHECK (auth.uid() \= requester\_user\_id);

\-- Trade participants can update trades  
CREATE POLICY "Participants can update trades"  
  ON trades FOR UPDATE  
  USING (  
    auth.uid() \= requester\_user\_id OR  
    auth.uid() \= owner\_user\_id  
  );  
\`\`\`

\#\#\#\# 8.2.4 Workspace Messages Table  
\`\`\`sql  
\-- Only workspace members can view messages  
CREATE POLICY "Members can view workspace messages"  
  ON workspace\_messages FOR SELECT  
  USING (  
    EXISTS (  
      SELECT 1 FROM workspace\_members  
      WHERE workspace\_id \= workspace\_messages.workspace\_id  
        AND user\_id \= auth.uid()  
    )  
  );

\-- Only workspace members can send messages  
CREATE POLICY "Members can send messages"  
  ON workspace\_messages FOR INSERT  
  WITH CHECK (  
    auth.uid() \= user\_id AND  
    EXISTS (  
      SELECT 1 FROM workspace\_members  
      WHERE workspace\_id \= workspace\_messages.workspace\_id  
        AND user\_id \= auth.uid()  
    )  
  );  
\`\`\`

\#\#\# 8.3 Data Privacy

\#\#\#\# 8.3.1 Personal Information  
\- Email addresses not publicly visible  
\- Full names optional (mononym used instead)  
\- Profile visibility controls  
\- Data export functionality (GDPR)  
\- Account deletion with data anonymization

\#\#\#\# 8.3.2 Communication Privacy  
\- Workspace messages encrypted in transit (TLS)  
\- Direct messages between users (future)  
\- Message deletion leaves tombstone  
\- Admin access logged and audited

\#\#\#\# 8.3.3 File Storage Security  
\- Files stored in private Supabase Storage buckets  
\- Signed URLs with expiration  
\- File type validation  
\- Malware scanning (future)  
\- Size limits enforced

\#\#\# 8.4 Rate Limiting

\#\#\#\# 8.4.1 API Rate Limits  
\- Authentication: 5 attempts per 15 minutes  
\- Listing creation: 10 per hour  
\- Trade proposals: 20 per hour  
\- Messages: 60 per minute  
\- File uploads: 10 per hour  
\- Search queries: 100 per minute

\#\#\#\# 8.4.2 Abuse Prevention  
\- IP-based rate limiting  
\- User-based rate limiting  
\- Exponential backoff on failures  
\- CAPTCHA for suspicious activity  
\- Account suspension for violations

\---

\#\# 9\. Performance Requirements

\#\#\# 9.1 Response Time Targets

| Operation | Target | Maximum |  
|-----------|--------|---------|  
| Page load (initial) | \< 2s | \< 4s |  
| Page navigation | \< 500ms | \< 1s |  
| Search query | \< 1s | \< 2s |  
| Message send | \< 200ms | \< 500ms |  
| File upload (1MB) | \< 3s | \< 6s |  
| Database query | \< 100ms | \< 300ms |  
| API endpoint | \< 500ms | \< 1s |

\#\#\# 9.2 Scalability Targets

\- Support 10,000 concurrent users  
\- Handle 100 requests per second  
\- Store 1 million listings  
\- Process 10,000 trades per day  
\- Deliver 100,000 notifications per day  
\- Store 10 TB of files

\#\#\# 9.3 Optimization Strategies

\#\#\#\# 9.3.1 Frontend Optimization  
\- Code splitting by route  
\- Lazy loading of components  
\- Image optimization (WebP, compression)  
\- Virtual scrolling for long lists  
\- Debounced search inputs  
\- Optimistic UI updates  
\- Service worker caching

\#\#\#\# 9.3.2 Backend Optimization  
\- Database query optimization  
\- Proper indexing strategy  
\- Connection pooling  
\- Caching frequently accessed data  
\- CDN for static assets  
\- Edge function optimization

\#\#\#\# 9.3.3 Caching Strategy  
\`\`\`  
Browser Cache (1 hour):  
├── Static assets (CSS, JS, images)  
└── User profile data

CDN Cache (24 hours):  
├── Public images  
├── Proof media  
└── Knowledge base articles

Application Cache (5 minutes):  
├── Dashboard metrics  
├── Platform statistics  
└── Search results

Database Cache (1 minute):  
├── User profiles  
├── Listing counts  
└── Trust scores  
\`\`\`

\---

\#\# 10\. Acceptance Criteria

\#\#\# 10.1 Functional Requirements

\#\#\#\# 10.1.1 User Authentication  
\- \[ \] User can register with email and password  
\- \[ \] User receives email verification link  
\- \[ \] User can verify email and activate account  
\- \[ \] User can login with verified credentials  
\- \[ \] User can reset password via email  
\- \[ \] User can logout and session is invalidated  
\- \[ \] User remains logged in for 30 days (remember me)

\#\#\#\# 10.1.2 Profile Management  
\- \[ \] User can complete profile setup (mononym, DNA type, skills)  
\- \[ \] User can upload and crop avatar image  
\- \[ \] User can edit profile information  
\- \[ \] User can view own profile  
\- \[ \] User can view other users' profiles  
\- \[ \] User can see trust score and average rating  
\- \[ \] User can manage notification preferences

\#\#\#\# 10.1.3 Skill Trading  
\- \[ \] User can create listing with all required fields  
\- \[ \] User can edit own listing  
\- \[ \] User can delete own listing  
\- \[ \] User can browse marketplace with filters  
\- \[ \] User can search listings by keywords  
\- \[ \] User can view listing details  
\- \[ \] User can submit trade proposal  
\- \[ \] Listing owner receives notification of proposal  
\- \[ \] Owner can accept, reject, or counter-offer  
\- \[ \] Requester receives notification of decision  
\- \[ \] Accepted trade creates workspace automatically  
\- \[ \] Both parties can mark trade as completed  
\- \[ \] Completed trade enables review submission

\#\#\#\# 10.1.4 Workspace Collaboration  
\- \[ \] User can create workspace  
\- \[ \] User can invite members to workspace  
\- \[ \] User can send messages in workspace  
\- \[ \] Messages appear in real-time for all members  
\- \[ \] User can upload files to workspace  
\- \[ \] User can mention other members (@username)  
\- \[ \] Mentioned users receive notification  
\- \[ \] User can leave workspace  
\- \[ \] Owner can remove members  
\- \[ \] Owner can archive workspace

\#\#\#\# 10.1.5 ProofChain & Reputation  
\- \[ \] User can create proof with media uploads  
\- \[ \] User can set proof visibility (public/private/connections)  
\- \[ \] User can view own ProofChain  
\- \[ \] User can view others' public proofs  
\- \[ \] User can endorse another user for a skill  
\- \[ \] Endorsed user receives notification  
\- \[ \] Endorsement increases trust score  
\- \[ \] User can submit review after trade completion  
\- \[ \] Review updates reviewee's average rating  
\- \[ \] Review impacts reviewee's trust score  
\- \[ \] Trust score changes are logged in history

\#\#\#\# 10.1.6 Dispute Resolution  
\- \[ \] User can file dispute on active trade  
\- \[ \] Respondent receives notification  
\- \[ \] Admins receive notification  
\- \[ \] Dispute is auto-assigned to admin  
\- \[ \] Admin can view dispute details  
\- \[ \] Admin can request additional evidence  
\- \[ \] Admin can resolve dispute with outcome  
\- \[ \] Both parties receive resolution notification  
\- \[ \] Trust scores are adjusted based on outcome  
\- \[ \] Resolved disputes are archived

\#\#\#\# 10.1.7 Knowledge Base  
\- \[ \] User can browse knowledge base categories  
\- \[ \] User can search articles by keywords  
\- \[ \] User can view article content  
\- \[ \] User can provide article feedback  
\- \[ \] Admin can create new article  
\- \[ \] Admin can edit existing article  
\- \[ \] Admin can publish/unpublish article  
\- \[ \] Published articles are visible to all users

\#\#\#\# 10.1.8 Analytics & Reporting  
\- \[ \] User sees dashboard with KPI metrics  
\- \[ \] User sees activity feed on dashboard  
\- \[ \] User sees onboarding checklist (if incomplete)  
\- \[ \] Admin sees platform-wide analytics  
\- \[ \] Admin sees user segmentation charts  
\- \[ \] Admin sees engagement metrics  
\- \[ \] Admin can export reports to CSV/PDF

\#\#\# 10.2 Non-Functional Requirements

\#\#\#\# 10.2.1 Performance  
\- \[ \] Initial page load completes in \< 4 seconds  
\- \[ \] Page navigation completes in \< 1 second  
\- \[ \] Search results return in \< 2 seconds  
\- \[ \] Messages send in \< 500ms  
\- \[ \] File uploads (1MB) complete in \< 6 seconds  
\- \[ \] Application supports 10,000 concurrent users

\#\#\#\# 10.2.2 Security  
\- \[ \] All API requests require authentication  
\- \[ \] Row Level Security enforced on all tables  
\- \[ \] Passwords hashed with bcrypt  
\- \[ \] Session tokens expire after 30 days  
\- \[ \] File uploads validated for type and size  
\- \[ \] Rate limiting prevents abuse  
\- \[ \] HTTPS enforced for all connections

\#\#\#\# 10.2.3 Usability  
\- \[ \] Application is responsive on mobile (320px+)  
\- \[ \] Application is responsive on tablet (768px+)  
\- \[ \] Application is responsive on desktop (1024px+)  
\- \[ \] Navigation menu collapses on mobile  
\- \[ \] Tables convert to cards on mobile  
\- \[ \] Forms are usable on mobile  
\- \[ \] Touch targets are ≥44px on mobile  
\- \[ \] Application follows WCAG 2.1 Level AA

\#\#\#\# 10.2.4 Reliability  
\- \[ \] Application has 99.9% uptime  
\- \[ \] Database backups run daily  
\- \[ \] Error boundaries catch React errors  
\- \[ \] Failed operations show user-friendly errors  
\- \[ \] Network errors trigger retry logic  
\- \[ \] Optimistic updates rollback on failure

\#\#\#\# 10.2.5 Maintainability  
\- \[ \] Code follows TypeScript best practices  
\- \[ \] Components are modular and reusable  
\- \[ \] Database schema is normalized  
\- \[ \] API endpoints are RESTful  
\- \[ \] Error logging captures stack traces  
\- \[ \] Performance monitoring tracks metrics

\---

\#\# Appendix A: Glossary

\*\*DNA Type\*\*: User personality classification (Builder, Thinker, Connector, Visionary)

\*\*Mononym\*\*: Unique username used as public identifier

\*\*ProofChain\*\*: User's portfolio of verified work and achievements

\*\*Skill Tag\*\*: Standardized skill identifier used for matching and search

\*\*Trade\*\*: Agreement between two users to exchange skills

\*\*Trust Score\*\*: Numerical reputation score (0-100) based on user behavior

\*\*Workspace\*\*: Collaboration space for trade participants or teams

\---

\#\# Appendix B: Change Log

| Version | Date | Changes | Author |  
|---------|------|---------|--------|  
| 1.0 | 2026-04-26 | Initial comprehensive requirements document | System |

\---

\*\*Document Status:\*\* Draft    
\*\*Last Updated:\*\* 2026-04-26    
\*\*Next Review:\*\* 2026-05-26

