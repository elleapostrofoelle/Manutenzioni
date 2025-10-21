# AI Rules for Manutenzioni Application

This document outlines the technical stack and guidelines for using libraries within the "Manutenzioni" application.

## Tech Stack Overview

The application is built using a modern full-stack approach with the following key technologies:

*   **Frontend**: Developed with **React** and **TypeScript** for a robust and type-safe user interface.
*   **Build Tool**: **Vite** is used for a fast and efficient frontend development experience and build process.
*   **Styling**: **Tailwind CSS** is the primary utility-first CSS framework for all styling, ensuring responsive and consistent designs.
*   **UI Components**: **shadcn/ui** components are utilized for pre-built, accessible, and customizable UI elements, built on top of Radix UI.
*   **Icons**: **lucide-react** provides a comprehensive set of SVG icons for the application.
*   **Routing**: **React Router** is used for client-side navigation and managing application views.
*   **Backend**: Powered by **Node.js** and the **Express.js** framework for building RESTful APIs.
*   **Database**: **MySQL** is used as the relational database for persistent data storage.
*   **PWA**: The application includes **Progressive Web App (PWA)** features, enabling offline capabilities and installability.

## Library Usage Rules

To maintain consistency, performance, and ease of development, please adhere to the following rules when using libraries:

*   **UI Components**:
    *   **Always** prioritize using components from `shadcn/ui`.
    *   If a required component is not available in `shadcn/ui` or needs significant custom styling, create a new component in `src/components/` and style it using Tailwind CSS.
    *   **Never** directly modify files within the `shadcn/ui` component directory.
*   **Styling**:
    *   **Exclusively** use Tailwind CSS classes for all component styling.
    *   `index.css` should only contain global CSS variables or very broad base styles. Avoid adding component-specific styles here.
*   **Icons**:
    *   **Always** use icons provided by the `lucide-react` library.
*   **Routing**:
    *   Implement client-side navigation using **React Router**. Define all primary application routes within `src/App.tsx`.
*   **State Management**:
    *   For local component state, use React's built-in `useState` and `useReducer` hooks.
    *   For global application state or complex data fetching, consider introducing a dedicated state management library (e.g., React Query, Zustand) if the need arises, but keep it simple for now with direct API calls.
*   **API Interaction (Frontend)**:
    *   All communication with the backend API must go through the utility functions defined in `src/api.ts`.
    *   Ensure all API calls are asynchronous and handle potential errors gracefully.
*   **Backend API Development**:
    *   Use **Express.js** for defining all API endpoints and handling server-side logic.
    *   All backend code should be written in **TypeScript**.
*   **Database Interaction (Backend)**:
    *   Use the `mysql2/promise` library for all interactions with the MySQL database.
    *   Ensure proper connection pooling and error handling for database operations.
*   **PWA Features**:
    *   The existing `sw.js` and `manifest.json` files manage the Progressive Web App functionality. Extend these files if more advanced offline or installation features are required.