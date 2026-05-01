\# Requirements Document

\#\# 1\. Application Overview

\#\#\# 1.1 Application Name  
CollabOS

\#\#\# 1.2 Application Description  
CollabOS is a comprehensive Freelance Operating System designed to streamline freelance business operations. It provides an integrated platform for project management, client relationship management, financial tracking, time management, business analytics, team collaboration, and client portal access. The application follows the exact implementation path defined in the provided PDF documents.

\#\#\# 1.3 Reference Files  
1\. collabos complete build final.pdf: https://miaoda-conversation-file.s3cdn.medo.dev/user-8ettrpbtzuv4/20260426/file-b8bweh1ego3k.pdf  
2\. collabos refined plan complete.pdf: https://miaoda-conversation-file.s3cdn.medo.dev/user-8ettrpbtzuv4/20260426/file-b8bwcpweuk8w.pdf

\#\# 2\. Users and Usage Scenarios

\#\#\# 2.1 Target Users  
\- Freelancers managing multiple clients and projects  
\- Independent contractors tracking time and finances  
\- Solo entrepreneurs running service-based businesses  
\- Team members collaborating on freelance projects  
\- Clients viewing invoices and making payments

\#\#\# 2.2 Core Usage Scenarios  
\- Managing client information and communication history  
\- Tracking project progress and deliverables  
\- Recording time spent on tasks and generating invoices  
\- Monitoring income, expenses, and financial health  
\- Analyzing business performance through dashboards  
\- Collaborating with team members on projects  
\- Clients accessing invoices and submitting payments

\#\# 3\. Page Structure and Functionality

\#\#\# 3.1 Page Structure  
\`\`\`  
CollabOS  
├── Authentication  
│   ├── Login Page  
│   ├── Registration Page  
│   └── Client Portal Login  
├── Dashboard  
│   ├── Overview Dashboard  
│   └── Analytics Dashboard  
├── Projects  
│   ├── Projects List  
│   ├── Project Detail  
│   └── Create/Edit Project  
├── Clients  
│   ├── Clients List  
│   ├── Client Detail  
│   └── Create/Edit Client  
├── Time Tracking  
│   ├── Time Entries List  
│   ├── Timer Interface  
│   └── Time Reports  
├── Finances  
│   ├── Invoices List  
│   ├── Invoice Detail  
│   ├── Create/Edit Invoice  
│   ├── Expenses List  
│   └── Create/Edit Expense  
├── Tasks  
│   ├── Tasks List  
│   ├── Task Detail  
│   └── Create/Edit Task  
├── Team  
│   ├── Team Members List  
│   ├── Member Detail  
│   ├── Invite Team Member  
│   └── Role Management  
├── Settings  
│   ├── Profile Settings  
│   ├── Business Settings  
│   └── Integration Settings  
└── Client Portal  
    ├── Portal Dashboard  
    ├── Invoices View  
    ├── Invoice Detail  
    └── Payment Submission  
\`\`\`

\#\#\# 3.2 Authentication

\#\#\#\# 3.2.1 Registration Page  
\- User registration form with fields: email, password, full name, business name  
\- Email verification process  
\- Terms of service acceptance  
\- Redirect to onboarding flow after successful registration  
\- Responsive layout for mobile and tablet devices

\#\#\#\# 3.2.2 Login Page  
\- Email and password login form  
\- Password reset functionality  
\- Remember me option  
\- Redirect to dashboard after successful login  
\- Responsive layout for mobile and tablet devices

\#\#\#\# 3.2.3 Client Portal Login  
\- Separate login interface for clients  
\- Email and access code authentication  
\- Password reset functionality  
\- Redirect to client portal dashboard after successful login  
\- Responsive layout for mobile and tablet devices

\#\#\# 3.3 Dashboard

\#\#\#\# 3.3.1 Overview Dashboard  
\- Key metrics display: active projects count, total revenue this month, hours tracked this week, pending invoices  
\- Recent activity feed showing latest projects, clients, and time entries  
\- Quick action buttons: start timer, create invoice, add project  
\- Upcoming deadlines widget  
\- Financial summary chart showing income vs expenses  
\- Responsive grid layout adapting to screen size

\#\#\#\# 3.3.2 Analytics Dashboard  
\- Revenue trends chart by month/quarter/year  
\- Project profitability analysis  
\- Client revenue breakdown  
\- Time allocation by project/client  
\- Expense categories breakdown  
\- Custom date range filtering  
\- Responsive charts and data visualization

\#\#\# 3.4 Projects

\#\#\#\# 3.4.1 Projects List  
\- Display all projects in table/card view with toggle  
\- Filter by status: active, completed, on hold, archived  
\- Search by project name or client  
\- Sort by: name, start date, deadline, budget  
\- Quick actions: view details, edit, archive  
\- Create new project button  
\- Responsive table converts to card view on mobile

\#\#\#\# 3.4.2 Project Detail  
\- Project information: name, client, description, status, dates, budget  
\- Associated tasks list with progress tracking  
\- Time entries logged for this project  
\- Related invoices  
\- Project notes and attachments  
\- Activity timeline  
\- Team members assigned to project  
\- Edit and delete project options  
\- Responsive layout with collapsible sections

\#\#\#\# 3.4.3 Create/Edit Project  
\- Form fields: project name, client selection, description, status, start date, deadline, budget type (fixed/hourly), budget amount  
\- Team member assignment  
\- Task creation within project setup  
\- Save as draft or publish  
\- Cancel and return to projects list  
\- Responsive form layout

\#\#\# 3.5 Clients

\#\#\#\# 3.5.1 Clients List  
\- Display all clients in table/card view  
\- Search by client name or company  
\- Filter by status: active, inactive  
\- Sort by: name, total revenue, project count  
\- Quick actions: view details, edit, archive  
\- Add new client button  
\- Responsive table converts to card view on mobile

\#\#\#\# 3.5.2 Client Detail  
\- Client information: name, company, email, phone, address  
\- Associated projects list  
\- Total revenue from client  
\- Communication history  
\- Invoices sent to client  
\- Client portal access status  
\- Edit and delete client options  
\- Responsive layout with collapsible sections

\#\#\#\# 3.5.3 Create/Edit Client  
\- Form fields: client name, company name, email, phone, address, notes  
\- Enable client portal access toggle  
\- Save and return to clients list  
\- Cancel option  
\- Responsive form layout

\#\#\# 3.6 Time Tracking

\#\#\#\# 3.6.1 Time Entries List  
\- Display all time entries in chronological order  
\- Filter by date range, project, client, team member  
\- Search by description  
\- Show: date, project, task, duration, description, billable status, team member  
\- Edit and delete time entry options  
\- Export time entries to CSV  
\- Responsive table converts to card view on mobile

\#\#\#\# 3.6.2 Timer Interface  
\- Start/stop timer with project and task selection  
\- Manual time entry option  
\- Current timer display with elapsed time  
\- Description field for time entry  
\- Billable/non-billable toggle  
\- Save time entry  
\- Responsive layout for mobile timer

\#\#\#\# 3.6.3 Time Reports  
\- Summary of hours by project/client/date range/team member  
\- Billable vs non-billable hours breakdown  
\- Visual charts for time distribution  
\- Export report functionality  
\- Responsive charts and data visualization

\#\#\# 3.7 Finances

\#\#\#\# 3.7.1 Invoices List  
\- Display all invoices with status: draft, sent, paid, overdue  
\- Filter by status, client, date range  
\- Search by invoice number or client  
\- Show: invoice number, client, amount, due date, status  
\- Quick actions: view, edit, send, mark as paid, delete  
\- Create new invoice button  
\- Responsive table converts to card view on mobile

\#\#\#\# 3.7.2 Invoice Detail  
\- Invoice information: number, client, issue date, due date, status  
\- Line items with description, quantity, rate, amount  
\- Subtotal, tax, total amount  
\- Payment terms and notes  
\- Send invoice via email  
\- Download PDF  
\- Mark as paid option  
\- Edit and delete invoice options  
\- Responsive layout with collapsible sections

\#\#\#\# 3.7.3 Create/Edit Invoice  
\- Form fields: client selection, invoice number (auto-generated), issue date, due date  
\- Line items section: add/remove items with description, quantity, rate  
\- Tax rate input  
\- Payment terms and notes fields  
\- Save as draft or send invoice  
\- Preview invoice before sending  
\- Responsive form layout

\#\#\#\# 3.7.4 Expenses List  
\- Display all expenses in chronological order  
\- Filter by date range, category, project, team member  
\- Search by description  
\- Show: date, category, amount, project, receipt status, team member  
\- Quick actions: view, edit, delete  
\- Add new expense button  
\- Total expenses summary  
\- Responsive table converts to card view on mobile

\#\#\#\# 3.7.5 Create/Edit Expense  
\- Form fields: date, category, amount, description, project (optional), receipt upload  
\- Save and return to expenses list  
\- Cancel option  
\- Responsive form layout

\#\#\# 3.8 Tasks

\#\#\#\# 3.8.1 Tasks List  
\- Display all tasks with status: to do, in progress, completed  
\- Filter by status, project, priority, due date, assigned team member  
\- Search by task name  
\- Sort by: due date, priority, project  
\- Quick actions: mark complete, edit, delete  
\- Create new task button  
\- Responsive table converts to card view on mobile

\#\#\#\# 3.8.2 Task Detail  
\- Task information: name, description, project, status, priority, due date  
\- Assigned team member  
\- Subtasks list  
\- Time entries logged for this task  
\- Comments and notes  
\- Edit and delete task options  
\- Responsive layout with collapsible sections

\#\#\#\# 3.8.3 Create/Edit Task  
\- Form fields: task name, description, project selection, status, priority, due date  
\- Team member assignment  
\- Add subtasks option  
\- Save and return to tasks list  
\- Cancel option  
\- Responsive form layout

\#\#\# 3.9 Team

\#\#\#\# 3.9.1 Team Members List  
\- Display all team members with role and status  
\- Search by name or email  
\- Filter by role: owner, admin, member  
\- Show: name, email, role, projects assigned, status  
\- Quick actions: view details, edit role, remove  
\- Invite team member button  
\- Responsive table converts to card view on mobile

\#\#\#\# 3.9.2 Member Detail  
\- Member information: name, email, role, join date  
\- Projects assigned  
\- Time entries logged  
\- Tasks assigned  
\- Activity history  
\- Edit role and remove member options  
\- Responsive layout with collapsible sections

\#\#\#\# 3.9.3 Invite Team Member  
\- Form fields: email, role selection, message  
\- Send invitation button  
\- Cancel and return to team list  
\- Responsive form layout

\#\#\#\# 3.9.4 Role Management  
\- Define permissions for each role: owner, admin, member  
\- Owner: full access to all features  
\- Admin: manage projects, clients, invoices, team members  
\- Member: view assigned projects, log time, create tasks  
\- Save role permissions  
\- Responsive layout

\#\#\# 3.10 Settings

\#\#\#\# 3.10.1 Profile Settings  
\- Edit user information: name, email, password  
\- Profile photo upload  
\- Notification preferences  
\- Save changes button  
\- Responsive form layout

\#\#\#\# 3.10.2 Business Settings  
\- Business information: business name, address, phone, website  
\- Tax settings: tax rate, tax ID  
\- Invoice settings: default payment terms, invoice prefix  
\- Currency selection  
\- Save changes button  
\- Responsive form layout

\#\#\#\# 3.10.3 Integration Settings  
\- Database connection configuration  
\- API keys management  
\- Third-party integrations setup  
\- Save changes button  
\- Responsive form layout

\#\#\# 3.11 Client Portal

\#\#\#\# 3.11.1 Portal Dashboard  
\- Welcome message with client name  
\- Summary of invoices: total outstanding, paid, overdue  
\- Recent invoices list  
\- Quick access to view all invoices  
\- Responsive layout for mobile and tablet devices

\#\#\#\# 3.11.2 Invoices View  
\- Display all invoices for the client  
\- Filter by status: unpaid, paid, overdue  
\- Search by invoice number  
\- Show: invoice number, issue date, due date, amount, status  
\- Quick actions: view details, pay invoice  
\- Responsive table converts to card view on mobile

\#\#\#\# 3.11.3 Invoice Detail  
\- Invoice information: number, issue date, due date, status  
\- Line items with description, quantity, rate, amount  
\- Subtotal, tax, total amount  
\- Payment terms and notes  
\- Download PDF  
\- Pay invoice button (if unpaid)  
\- Responsive layout with collapsible sections

\#\#\#\# 3.11.4 Payment Submission  
\- Payment amount display  
\- Payment method selection: credit card, bank transfer, other  
\- Payment details form  
\- Submit payment button  
\- Confirmation message after successful payment  
\- Responsive form layout

\#\# 4\. Business Rules and Logic

\#\#\# 4.1 Project Management Rules  
\- Projects must be associated with a client  
\- Project status can be: active, completed, on hold, archived  
\- Budget tracking: system calculates actual cost based on time entries and compares with budget  
\- Project completion requires all associated tasks to be marked complete  
\- Team members can be assigned to projects based on role permissions

\#\#\# 4.2 Time Tracking Rules  
\- Time entries must be associated with a project and optionally a task  
\- Only one timer can run at a time per user  
\- Billable hours are included in invoice calculations  
\- Time entries can be edited or deleted within 30 days  
\- Team members can only view and edit their own time entries unless they have admin or owner role

\#\#\# 4.3 Invoice Rules  
\- Invoice numbers are auto-generated and sequential  
\- Invoices can be in status: draft, sent, paid, overdue  
\- Overdue status is automatically applied when due date passes and invoice is unpaid  
\- Line items can be added from time entries or manually entered  
\- Tax is calculated based on subtotal and tax rate  
\- Invoices marked as paid update client revenue totals  
\- Clients with portal access can view and pay their invoices

\#\#\# 4.4 Financial Tracking Rules  
\- Expenses can be categorized: office supplies, software, travel, meals, etc.  
\- Expenses can be linked to projects for profitability analysis  
\- Revenue is calculated from paid invoices  
\- Profit \= Revenue \- Expenses  
\- Team members can log expenses based on role permissions

\#\#\# 4.5 Client Management Rules  
\- Each client can have multiple projects  
\- Client status: active (has active projects), inactive (no active projects)  
\- Client deletion is restricted if associated with projects or invoices  
\- Clients can be granted portal access to view invoices and make payments

\#\#\# 4.6 Task Management Rules  
\- Tasks must be associated with a project  
\- Task priority levels: low, medium, high  
\- Tasks can have subtasks for breakdown of work  
\- Completed tasks contribute to project progress calculation  
\- Tasks can be assigned to team members

\#\#\# 4.7 User Authentication Rules  
\- Email verification required for new registrations  
\- Password must meet minimum security requirements  
\- Session expires after 30 days of inactivity  
\- Password reset via email verification  
\- Client portal uses separate authentication with email and access code

\#\#\# 4.8 Trade Proposal Notification Rules  
\- When a trade proposal is submitted, the notify-trade-proposal Edge Function is triggered  
\- Function inserts a notification row with type: trade\_proposal for the recipient  
\- Function inserts an activity\_feed row for the recipient  
\- Triggered at the moment the trades row is inserted

\#\#\# 4.9 Platform Statistics Rules  
\- Public stats bar on landing page displays live platform statistics  
\- Statistics fetched from public Supabase view named platform\_stats  
\- View calculates: total trades completed (count trades WHERE status \= completed), total verified professionals (count distinct users in profiles), total hours exchanged (sum hours\_offered from completed trades)  
\- View has public SELECT policy

\#\#\# 4.10 Notification Preferences Rules  
\- User notification preferences stored in notification\_preferences JSONB field on profiles table  
\- Field stores toggle preferences per notification type  
\- Default value: empty JSON object  
\- Managed through Settings page

\#\#\# 4.11 Referral Bonus Rules  
\- When a new user signs up with a referral code, both users receive \+5 Trust Score  
\- Triggered by database trigger when new profile is inserted with non-null referred\_by  
\- Calls recalculate-trust-score Edge Function for both new user and referrer  
\- Event type: referral\_bonus with delta \= 5  
\- Recorded in trust\_score\_history table

\#\#\# 4.12 Team Collaboration Rules  
\- Team members can be invited via email  
\- Roles determine access permissions: owner, admin, member  
\- Owner has full access to all features and settings  
\- Admin can manage projects, clients, invoices, and team members  
\- Member can view assigned projects, log time, and create tasks  
\- Team members can only access projects they are assigned to  
\- Activity feed shows team member actions for transparency

\#\#\# 4.13 Client Portal Rules  
\- Clients must be granted portal access by the business owner or admin  
\- Clients receive access code via email to login  
\- Clients can only view invoices associated with their account  
\- Clients can download invoice PDFs  
\- Clients can submit payments through the portal  
\- Payment submissions update invoice status to paid

\#\#\# 4.14 Responsive Design Rules  
\- Application must adapt to screen sizes: mobile (320px-767px), tablet (768px-1023px), desktop (1024px+)  
\- Navigation menu collapses to hamburger menu on mobile  
\- Tables convert to card view on mobile for better readability  
\- Forms stack vertically on mobile  
\- Charts and data visualizations scale appropriately  
\- Touch-friendly interface elements on mobile devices

\#\# 5\. Exception and Boundary Cases

| Scenario | Handling |  
|----------|----------|  
| User attempts to delete client with active projects | Display error message: Cannot delete client with active projects. Archive projects first. |  
| User attempts to start timer while another is running | Stop current timer and start new timer, prompt user to confirm |  
| Invoice due date is in the past when creating | Display warning but allow creation |  
| User attempts to delete project with time entries | Display confirmation dialog: This project has time entries. Deleting will remove all associated data. Continue? |  
| Time entry duration exceeds 24 hours | Display warning: Time entry exceeds 24 hours. Please verify. |  
| User attempts to mark invoice as paid without payment date | Auto\-fill payment date with current date |  
| Expense amount is negative | Display error: Amount must be positive |  
| User uploads receipt file exceeding size limit | Display error: File size exceeds maximum allowed |  
| Project budget is exceeded | Display warning on project detail page |  
| User attempts to access deleted/archived resource | Display 404 error page with return to dashboard option |  
| Trade proposal notification fails to send | Log error and retry notification delivery |  
| Platform stats view query fails | Display cached statistics or fallback message |  
| Referral bonus trigger fails | Log error and queue for manual review |  
| Team member attempts to access restricted feature | Display error message: You do not have permission to access this feature. |  
| Client attempts to access another client's invoices | Display error message: Access denied. |  
| Client portal login with invalid access code | Display error message: Invalid access code. Please check your email. |  
| Payment submission fails | Display error message: Payment failed. Please try again or contact support. |  
| Team member invitation email fails to send | Display error message: Invitation failed to send. Please try again. |  
| User attempts to remove owner role | Display error message: Cannot remove owner role. Transfer ownership first. |

\#\# 6\. Acceptance Criteria

1\. User can successfully register and login to the system  
2\. User can create, view, edit, and delete clients  
3\. User can create, view, edit, and archive projects  
4\. User can start/stop timer and manually log time entries  
5\. User can create invoices from time entries or manually  
6\. User can send invoices and mark them as paid  
7\. User can record and categorize expenses  
8\. User can create and manage tasks associated with projects  
9\. Dashboard displays accurate real-time metrics and summaries  
10\. Analytics dashboard provides visual insights into business performance  
11\. All data is persisted in database and retrievable across sessions  
12\. User can filter, search, and sort data in all list views  
13\. User can export time reports and invoices to PDF/CSV  
14\. System automatically calculates invoice totals, project budgets, and financial summaries  
15\. All forms include proper validation and error messaging  
16\. User can update profile and business settings  
17\. System enforces business rules for project completion, invoice status, and client management  
18\. Responsive design works across desktop, tablet, and mobile devices  
19\. Trade proposal notifications are sent successfully to recipients  
20\. Platform statistics are displayed accurately on landing page  
21\. Notification preferences are saved and applied correctly  
22\. Referral bonuses are awarded to both referrer and new user upon signup  
23\. notify-trade-proposal Edge Function executes correctly on trade submission  
24\. platform\_stats view returns accurate live statistics  
25\. notification\_preferences field stores and retrieves user preferences  
26\. recalculate-trust-score Edge Function processes referral bonuses correctly  
27\. Owner can invite team members via email  
28\. Team members receive invitation and can accept to join  
29\. Role-based permissions are enforced correctly  
30\. Team members can view and edit only their assigned projects and tasks  
31\. Activity feed shows team member actions  
32\. Owner or admin can grant client portal access  
33\. Clients receive access code via email  
34\. Clients can login to portal and view their invoices  
35\. Clients can download invoice PDFs from portal  
36\. Clients can submit payments through portal  
37\. Payment submissions update invoice status to paid  
38\. Application layout adapts to mobile, tablet, and desktop screen sizes  
39\. Navigation menu collapses to hamburger menu on mobile  
40\. Tables convert to card view on mobile  
41\. Forms are usable and readable on mobile devices  
42\. Touch interactions work correctly on mobile devices  
43\. All features from PDF documents are implemented as specified  
44\. Database schema follows the structure defined in Part 4 of the PDF  
45\. Edge Functions are implemented as described in Part 5 of the PDF  
46\. Design system follows guidelines in Part 2 of the PDF  
47\. Component library matches specifications in Part 8 of the PDF  
48\. User behaviors follow patterns described in Part 20 of the PDF  
