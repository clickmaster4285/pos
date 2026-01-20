# Project Context & Planning Protocol

**Important:** Before executing any command or making any changes to the codebase, we must first create a clear plan. This plan should outline:
1.  **The Goal:** What is the specific issue to solve or feature to implement?
2.  **The Approach:** How will we solve the issue or implement the feature?
3.  **The Steps:** What are the concrete steps we will take?

This ensures that every change is deliberate, well-understood, and aligned with the project's goals.

## Project Overview

This project is a modern, full-stack Point of Sale (POS) and business management system. It's structured as a monorepo containing a Node.js/Express backend and a Next.js/React frontend.

### Backend (`/backend`)

The backend is a comprehensive, multi-tenant business management platform.

*   **Technology Stack:**
    *   Node.js
    *   Express.js
    *   MongoDB (with Mongoose for data modeling)
    *   Passport.js for JWT-based authentication
    *   Stripe for payment processing
    *   Integrates with ZKTeco attendance devices.

*   **Core Functionality:**
    *   **Multi-Tenancy:** Manages multiple `Companies`, each with its own data (users, products, etc.). Companies subscribe to different `Plans`.
    *   **POS & Sales:** Handles `Orders`, `Billing`, and `Table` management for restaurant or retail environments.
    *   **Inventory:** Manages `Products`, `Categories`, and `Ingredients`.
    *   **HR & Staff:** Includes `StaffSalary` and `Attendance` tracking, with direct hardware integration for attendance devices.
    *   **Logistics:** Manages `Vendors`, `Couriers`, and `Shipments`.
    *   **Authentication:** Secure authentication using JSON Web Tokens (JWTs).

*   **Structure:** The backend code is well-organized by feature into `routes`, `controllers`, and `models`, making it easier to maintain and extend.

### Frontend (`/frontend`)

The frontend is a modern, responsive user interface for all backend features, built with role-based access in mind.

*   **Technology Stack:**
    *   Next.js (App Router)
    *   React
    *   Redux Toolkit for state management
    *   Tailwind CSS for styling
    *   `shadcn/ui` for a modern component library

*   **Core Functionality:**
    *   Provides user interfaces for all backend features.
    *   **Role-Based Access Control (RBAC):** The application has distinct dashboards and permissions for different user roles:
        *   **Superadmin:** Manages the entire platform (tenants, plans).
        *   **Admin:** Manages all aspects of a single company.
        *   **Staff:** Employees with limited permissions.

*   **Structure:** The frontend follows the Next.js App Router paradigm, where routing is defined by the directory structure in `frontend/src/app`. This clearly separates pages by user role. A `middleware.js` file handles the logic for protecting routes.
