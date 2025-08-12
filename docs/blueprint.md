# **App Name**: FlexWave Deals

## Core Features:

- Splash Screen: Splash screen with the FlexWave Deals logo.
- Home Screen Input: Home screen with referral code and package ID input fields, and a 'Load Package' button.
- Package Display: Display of package details, including descriptions for each trip, promotional and regular prices, a 48-hour countdown timer, and a non-refundable disclaimer.
- Checkout Button: Functional "Checkout" button as a placeholder for Stripe integration.
- Admin Login: Admin login page with email and password fields using Firebase Authentication. If authentication fails after 3 attempts, make use of reCAPTCHA v3 to avoid bots.
- Admin Dashboard: Admin dashboard to list packages, expiry times, referral codes, and sales tracking, loaded using Firestore.
- Offline Data Support: Offer placeholder data for offline viewing and basic functionality (data pre-cached on the app).

## Style Guidelines:

- Primary color: Vibrant turquoise (#40E0D0), echoing tropical ocean waters.
- Background color: Desaturated pale turquoise (#E0FFFF) offering a light, airy feel.
- Accent color: Sandy beige (#F0E68C) evoking beaches, used for highlights and key CTAs.
- Body and headline font: 'PT Sans' (sans-serif) for readability and a modern look.
- Use clean, simple icons for navigation and trip representation, sticking to the modern tropical theme.
- Clean UI design with clear separation of elements, large buttons, and a focus on visual clarity.
- Subtle animations, such as smooth transitions and a gentle wave effect on the splash screen, will enhance the user experience without being intrusive.