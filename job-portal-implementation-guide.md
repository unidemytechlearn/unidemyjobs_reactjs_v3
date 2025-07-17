# Job Portal Implementation Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Technology Stack](#technology-stack)
3. [Setting Up the Development Environment](#setting-up-the-development-environment)
4. [Supabase Integration](#supabase-integration)
5. [Authentication Implementation](#authentication-implementation)
6. [Database Schema Design](#database-schema-design)
7. [Frontend Development](#frontend-development)
8. [Role-Based Access Control](#role-based-access-control)
9. [Deployment Process](#deployment-process)
10. [GitHub Integration](#github-integration)
11. [Testing and Quality Assurance](#testing-and-quality-assurance)
12. [Troubleshooting Common Issues](#troubleshooting-common-issues)
13. [Future Enhancements](#future-enhancements)

## Introduction

This guide provides a comprehensive overview of implementing a job portal application using Bolt, Supabase, and GitHub. The job portal allows two types of users - job seekers and employers - to interact with the platform in different ways. Job seekers can browse and apply for jobs, while employers can post jobs and manage applications.

## Technology Stack

Our job portal application uses the following technologies:

- **Frontend**: React with TypeScript
- **UI Framework**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL database, authentication, storage)
- **Development Environment**: Bolt (StackBlitz)
- **Version Control**: GitHub
- **Deployment**: Netlify

## Setting Up the Development Environment

### 1. Creating a New Project with Bolt

Bolt is an AI-powered development environment by StackBlitz that helps accelerate development.

1. Visit [bolt.new](https://bolt.new)
2. Choose a React + TypeScript template
3. Initialize the project with the following command:

```bash
npm create vite@latest job-portal -- --template react-ts
cd job-portal
npm install
```

### 2. Installing Dependencies

Install the required dependencies:

```bash
npm add @supabase/supabase-js lucide-react
npm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Configuring Tailwind CSS

Configure Tailwind CSS by updating the `tailwind.config.js` file:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Add Tailwind directives to your CSS file:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Supabase Integration

### 1. Setting Up a Supabase Project

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2. Configuring Environment Variables

Create a `.env` file in your project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Creating a Supabase Client

Create a file `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Authentication Implementation

### 1. Setting Up Authentication in Supabase

1. Go to Authentication > Settings in your Supabase dashboard
2. Enable Email/Password sign-in method
3. Configure email templates if needed

### 2. Implementing Sign Up Functionality

Create a SignUpModal component that handles user registration:

```typescript
// src/components/SignUpModal.tsx
import { useState } from 'react';
import { signUp } from '../lib/supabase';

// Component implementation...
```

### 3. Implementing Sign In Functionality

Create a SignInModal component for user authentication:

```typescript
// src/components/SignInModal.tsx
import { useState } from 'react';
import { signIn } from '../lib/supabase';

// Component implementation...
```

### 4. Role-Based Authentication

Implement separate authentication flows for job seekers and employers:

```typescript
// src/lib/supabase.ts

export const signInAsJobSeeker = async (email: string, password: string) => {
  // Implementation...
};

export const signInAsEmployer = async (email: string, password: string) => {
  // Implementation...
};
```

## Database Schema Design

### 1. Users Table

The `users` table is automatically created by Supabase Auth.

### 2. Profiles Table

Create a `profiles` table to store user profile information:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  bio TEXT,
  job_title TEXT,
  company TEXT,
  experience_level TEXT,
  salary_range TEXT,
  availability TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  resume_url TEXT,
  profile_visibility TEXT DEFAULT 'public',
  show_salary BOOLEAN DEFAULT false,
  show_contact BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  job_alerts BOOLEAN DEFAULT true,
  application_updates BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  profile_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resume_file_name TEXT,
  resume_uploaded_at TIMESTAMPTZ,
  resume_file_size INTEGER,
  profile_picture_url TEXT,
  profile_picture_uploaded_at TIMESTAMPTZ,
  role TEXT DEFAULT 'job_seeker',
  company_name TEXT,
  company_position TEXT,
  company_size TEXT
);
```

### 3. Companies Table

Create a `companies` table for employer company profiles:

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  size_range TEXT,
  location TEXT,
  website_url TEXT,
  logo_url TEXT,
  rating NUMERIC(2,1) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  founded_year INTEGER,
  specialties TEXT[],
  benefits TEXT[],
  culture_description TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. Jobs Table

Create a `jobs` table for job listings:

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL,
  experience_level TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  is_remote BOOLEAN DEFAULT false,
  requirements TEXT[],
  benefits TEXT[],
  skills_required TEXT[],
  application_deadline DATE,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5. Applications Table

Create an `applications` table for job applications:

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'submitted',
  cover_letter TEXT,
  resume_url TEXT,
  expected_salary TEXT,
  availability_date DATE,
  portfolio_url TEXT,
  linkedin_url TEXT,
  additional_info JSONB,
  applied_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  years_experience TEXT,
  current_salary TEXT,
  notice_period TEXT,
  skills TEXT[],
  github_url TEXT,
  website_url TEXT,
  referral_source TEXT,
  is_remote_preferred BOOLEAN DEFAULT false,
  willing_to_relocate BOOLEAN DEFAULT false,
  application_source TEXT DEFAULT 'website',
  screening_answers JSONB
);
```

### 6. Additional Tables

Create additional tables for supporting features:

- `saved_jobs`: For job bookmarking
- `skills`: For skill taxonomy
- `user_skills`: For user-skill relationships
- `notifications`: For user notifications
- `application_status_history`: For tracking application status changes

## Frontend Development

### 1. Project Structure

Organize your project with the following structure:

```
src/
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── JobsPage.tsx
│   ├── CompaniesPage.tsx
│   ├── Dashboard.tsx
│   ├── EmployerDashboard.tsx
│   └── ...
├── lib/
│   ├── supabase.ts
│   ├── employer.ts
│   ├── applications.ts
│   ├── notifications.ts
│   └── ...
├── hooks/
│   ├── useAuth.ts
│   └── ...
├── App.tsx
├── main.tsx
└── index.css
```

### 2. Implementing the Main App Component

Create the main App component that handles routing and authentication:

```typescript
// src/App.tsx
import { useState } from 'react';
import { AuthProvider } from './components/AuthProvider';
import Header from './components/Header';
// Other imports...

function App() {
  // Component implementation...
}

export default App;
```

### 3. Creating Reusable Components

Develop reusable components for common UI elements:

- Header
- Footer
- Job cards
- Company cards
- Modals
- Form elements

### 4. Implementing Pages

Create separate page components for different sections of the application:

- Home page
- Jobs page
- Companies page
- Job details page
- Dashboard
- Employer dashboard

## Role-Based Access Control

### 1. Implementing Role-Based UI

Show different UI elements based on user role:

```typescript
// src/components/Header.tsx
import { useAuthContext } from './AuthProvider';

const Header = () => {
  const { isAuthenticated, profile } = useAuthContext();
  
  return (
    <header>
      {/* Common elements */}
      
      {isAuthenticated && profile?.role === 'employer' ? (
        <button onClick={() => onNavigate('employer-dashboard')}>
          Employer Dashboard
        </button>
      ) : isAuthenticated && profile?.role !== 'employer' ? (
        <button onClick={() => onNavigate('dashboard')}>
          Dashboard
        </button>
      ) : (
        <button onClick={() => onNavigate('employer')}>
          For Employers
        </button>
      )}
      
      {/* Other elements */}
    </header>
  );
};
```

### 2. Implementing Role-Based API Access

Use Supabase Row Level Security (RLS) policies to control data access:

```sql
-- Allow employers to manage their own jobs
CREATE POLICY "Employers can manage their jobs"
ON jobs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'employer'
    AND (jobs.created_by = auth.uid() OR jobs.created_by IS NULL)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'employer'
  )
);
```

### 3. Implementing Role-Based Authentication

Ensure users can only sign in through the appropriate portal:

```typescript
// src/lib/supabase.ts

export const signInAsJobSeeker = async (email: string, password: string) => {
  try {
    // First authenticate the user
    const authData = await signIn(email, password);
    
    if (!authData.user) {
      throw new Error('Authentication failed');
    }
    
    // Then check if they have the correct role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      // If we can't fetch the profile, sign out and throw an error
      await supabase.auth.signOut();
      throw new Error('Failed to verify user role');
    }
    
    if (profileData.role === 'employer') {
      // If they're an employer, sign out and throw an error
      await supabase.auth.signOut();
      throw new Error('This account is registered as an employer. Please use the employer login instead.');
    }
    
    // Return the auth data if everything is fine
    return authData;
  } catch (error) {
    // Make sure user is signed out if there's any error
    await supabase.auth.signOut();
    throw error;
  }
};
```

## Deployment Process

### 1. Building the Application

Build the application for production:

```bash
npm run build
```

### 2. Deploying to Netlify

1. Create a Netlify account
2. Connect your GitHub repository
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy the application

### 3. Custom Domain Setup (Optional)

1. Purchase a domain name
2. Configure DNS settings
3. Add the domain to your Netlify site

## GitHub Integration

### 1. Setting Up a GitHub Repository

1. Create a new repository on GitHub
2. Initialize Git in your local project:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/job-portal.git
git push -u origin main
```

### 2. Implementing CI/CD with GitHub Actions

Create a `.github/workflows/main.yml` file:

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### 3. Collaborative Development

1. Create feature branches for new features
2. Submit pull requests for code review
3. Merge approved pull requests into the main branch

## Testing and Quality Assurance

### 1. Unit Testing

Implement unit tests using Jest and React Testing Library:

```bash
npm add -D jest @testing-library/react @testing-library/jest-dom
```

Create test files with the `.test.tsx` extension:

```typescript
// src/components/Header.test.tsx
import { render, screen } from '@testing-library/react';
import Header from './Header';

test('renders logo', () => {
  render(<Header />);
  const logoElement = screen.getByText(/Unidemy Jobs/i);
  expect(logoElement).toBeInTheDocument();
});
```

### 2. End-to-End Testing

Implement end-to-end tests using Cypress:

```bash
npm add -D cypress
```

Create Cypress tests:

```javascript
// cypress/integration/login.spec.js
describe('Login', () => {
  it('should login as job seeker', () => {
    cy.visit('/');
    cy.contains('Sign In').click();
    cy.get('input[name="email"]').type('jobseeker@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Sign In').click();
    cy.contains('Dashboard').should('be.visible');
  });
});
```

### 3. Manual Testing

Perform manual testing for:

- User registration and login
- Job posting and application
- Profile management
- Notifications
- Responsive design

## Troubleshooting Common Issues

### 1. Authentication Issues

- **Invalid Credentials**: Ensure the email and password are correct
- **Role Mismatch**: Make sure users are using the correct login portal
- **Missing Profile**: Check if the user profile exists in the database

### 2. Database Issues

- **Permission Denied**: Verify RLS policies
- **Missing Tables**: Check if all required tables are created
- **Foreign Key Constraints**: Ensure related records exist

### 3. Deployment Issues

- **Build Failures**: Check for syntax errors or missing dependencies
- **Environment Variables**: Verify environment variables are set correctly
- **CORS Issues**: Configure CORS settings in Supabase

## Future Enhancements

### 1. Advanced Features

- Implement AI-powered job matching
- Add resume parsing functionality
- Integrate with external job boards
- Implement advanced analytics

### 2. Performance Optimizations

- Implement server-side rendering
- Optimize database queries
- Add caching mechanisms
- Implement lazy loading

### 3. Mobile Applications

- Develop native mobile applications
- Implement push notifications
- Add offline support

## Conclusion

This guide provides a comprehensive overview of implementing a job portal application using Bolt, Supabase, and GitHub. By following these steps, you can create a fully functional job portal with role-based access control, robust authentication, and a seamless user experience.