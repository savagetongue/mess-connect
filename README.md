# Mess Connect

[cloudflarebutton]

Mess Connect is a comprehensive, subscription-based mess management system designed for seamless interaction between students, mess managers, and administrators. The platform operates on a robust, serverless architecture using Cloudflare Workers and Durable Objects, ensuring data persistence and high availability. It features distinct, role-based dashboards tailored to the specific needs of each user group.

## Key Features

-   **Role-Based Dashboards**: Separate, tailored interfaces for Students, Managers, and Administrators.
-   **Student Management**: Students can register, view menus, manage dues, and monitor their account status.
-   **Feedback System**: Students can raise complaints with image attachments and provide suggestions.
-   **Manager Toolkit**: A full suite of tools for managers to handle student admissions, update menus, view financial stats, and respond to feedback.
-   **Admin Oversight**: A high-level dashboard for administrators to monitor manager-student interactions and ensure service quality.
-   **Guest Payments**: A simple, login-free portal for guests to make one-time payments.
-   **Persistent Storage**: Built on Cloudflare Durable Objects to ensure all data is saved and consistent.
-   **Modern UI**: A clean, minimalist, and responsive design built with shadcn/ui and Tailwind CSS.

## Technology Stack

-   **Frontend**: React, React Router, Zustand, shadcn/ui, Tailwind CSS, Framer Motion, Vite
-   **Backend**: Hono on Cloudflare Workers
-   **Storage**: Cloudflare Durable Objects
-   **Language**: TypeScript
-   **Package Manager**: Bun

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have the following software installed on your machine:

-   [Bun](https://bun.sh/)
-   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd mess-connect
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

## Development

To run the application in a local development environment, which starts both the Vite frontend server and a local Wrangler instance for the backend, use the following command:

```bash
bun dev
```

The application will be available at `http://localhost:3000`.

## Deployment

This project is configured for seamless deployment to Cloudflare Workers.

1.  **Build the application:**
    ```bash
    bun run build
    ```

2.  **Deploy to Cloudflare:**
    ```bash
    bun run deploy
    ```

This command will build the frontend assets and deploy the worker to your Cloudflare account.

Alternatively, you can deploy your own version of this project with a single click.

[cloudflarebutton]

## Project Structure

-   `src/`: Contains the React frontend application code, including pages, components, hooks, and utility functions.
-   `worker/`: Contains the Hono backend server code, running on Cloudflare Workers. This includes API routes and entity definitions for Durable Objects.
-   `shared/`: Contains shared types and interfaces used by both the frontend and backend to ensure type safety.