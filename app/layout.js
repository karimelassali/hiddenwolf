
import "./globals.css";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("@/components/navbar"));



export const metadata = {
  title: "Wolf Game",
  description:
    "A social deduction game where players try to figure out who is a wolf and who is a villager.",
};

/**
 * The root layout component.
 *
 * This component is the top-level layout component that wraps all pages.
 * It renders the navbar and the children (i.e. the current page).
 */
export default function RootLayout({ children }) {
  return (
    /**
     * The ClerkProvider component is a wrapper around the Next.js app
     * that handles authentication and authorization.
     *
     * It injects the Clerk client into the context of the app, which
     * allows us to use the Clerk hooks and components.
     */
    <ClerkProvider>
      <html className="h-full scrollbar-hide" lang="en">
        <body className={`scrollbar-hide antialiased h-full`}>
          <Navbar />
          {/* The navbar component renders the navigation bar at the top of the page */}
          {/* The children prop is the current page */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
