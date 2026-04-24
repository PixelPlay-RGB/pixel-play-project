---
name: project-stack
description: Guide for using the project's tech stack. Use when generating components, handling state, creating forms, fetching data, or interacting with the backend. Covers Next.js (App Router), Tailwind CSS, Shadcn UI, Zustand, TanStack Query, React Hook Form, Zod, and Supabase.
---

# Project Tech Stack Guidelines

This skill guides the agent on the preferred libraries and patterns for this project.

## Framework & UI

- **Next.js (App Router)**: Use App Router conventions (`app/` directory). Default to React Server Components. Use `"use client"` only when client-side interactivity or React hooks are required.
- **Tailwind CSS**: Use Tailwind utility classes for styling. Avoid custom CSS files unless absolutely necessary.
- **Shadcn UI**: Use Shadcn UI components for standard UI elements. They are typically located in `src/components/ui`.

## State & Data Management

- **Zustand**: Use Zustand for global client state management. Keep stores modular and focused.
- **TanStack Query**: Use TanStack Query (React Query) for server state management, data fetching, caching, and mutations. Do not use `useEffect` for data fetching.

## Forms & Validation

- **React Hook Form**: Use React Hook Form for handling form state, submissions, and field tracking.
- **Zod**: Use Zod for schema validation. Integrate Zod with React Hook Form using `@hookform/resolvers/zod`.

## Backend

- **Supabase**: Use Supabase for authentication and real-time database operations. Ensure proper Row Level Security (RLS) policies are considered when interacting with the database.
