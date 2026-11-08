# Role-aware sign-in testing

1. Run `npm install`.
2. Run `npm run dev`.
3. Open `http://localhost:3000/auth/sign-in`.
4. Choose **Property Manager** or **Tenant**.
5. Sign in with an account whose database `user.role` matches the selected option.
6. Manager accounts redirect to `/dashboard` or onboarding.
7. Tenant accounts redirect to `/tenant/dashboard`.
8. A role mismatch returns the user to sign-in with an explanatory message.

Important: one email currently supports one role. Use separate manager and tenant accounts for a clean test.
