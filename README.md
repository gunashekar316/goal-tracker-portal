# 🎯 Enterprise Goal Tracking Portal

A full-stack, enterprise-grade goal management application built to align company-wide KPIs with individual employee performance. 

## 🚀 Features & "Must-Haves" Completed
* **Role-Based Access (Mock Auth):** Distinct dashboards and permissions for Employees, Managers, and Admins.
* **Dynamic UoM Math Engine:** Automatically calculates progress scores based on diverse Units of Measurement (Numeric limits, Percentages, and Date/Timeline calculations).
* **Shared Company KPIs:** Admins can set global "North Star" metrics that employees can seamlessly import into their personal goal sheets.
* **Strict Weightage Validation:** Forms enforce a strict 100% total weightage rule per quarter.
* **System Audit Trail:** A full chronological log tracking goal sheet submissions, manager approvals, and Admin overrides.

## 💻 Tech Stack
* **Frontend:** Next.js (App Router), React, Tailwind CSS
* **Backend:** Next.js Server Actions, Zod (Data Validation)
* **Database:** Prisma ORM, SQLite

## 🛠️ How to Run Locally for Judging
1. Clone the repository: `git clone https://github.com/gunashekar316/goal-tracker-portal.git`
2. Install dependencies: `npm install`
3. Push the database schema: `npx prisma db push`
4. Start the development server: `npm run dev`
5. Open `http://localhost:3000` in your browser. Use the dropdown in the top right to switch between Employee, Manager, and Admin roles.