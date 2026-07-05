import React from "react";
import { NavLink } from "react-router-dom";

export default function Notfound() {
  const teal = "#44cfc2";

  const pages = [
    { name: "Home", path: "/" },
    { name: "Landing", path: "/landing" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "Login", path: "/login" },
    { name: "Signup", path: "/signup" },
    { name: "Profile", path: "/profile" },
    { name: "Settings", path: "/settings" },
    { name: "Room", path: "/room" },
    { name: "Users", path: "/users" },
  ];

  return (
    <section
      className="flex items-center justify-center min-h-screen px-6 transition-colors duration-300 bg-gray-50 dark:bg-[#121214]"
    >
      <div className="text-center max-w-3xl">

        <h1
          className="text-8xl md:text-9xl font-extrabold tracking-wider mb-4"
          style={{
            backgroundImage: `linear-gradient(to right, ${teal}, ${teal}aa)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </h1>

        <p className="mt-4 text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-200">
          Oops! Page not found.
        </p>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          The page you’re looking for doesn’t exist or has been moved.
        </p>

        <NavLink
          to="/"
          className="inline-block mt-6 px-8 py-3 rounded-full font-medium shadow-lg transition-all duration-300"
          style={{
            backgroundColor: teal,
            color: "#000",
            boxShadow: `0 0 20px ${teal}66`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#3db8ac";
            e.currentTarget.style.boxShadow = `0 0 25px ${teal}99`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = teal;
            e.currentTarget.style.boxShadow = `0 0 20px ${teal}66`;
          }}
        >
          Go Home
        </NavLink>

        <div className="mt-10 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {pages.map((page) => (
            <NavLink
              key={page.path}
              to={page.path}
              className="px-6 py-3 rounded-lg border border-[#44cfc2] text-[#44cfc2] hover:bg-[#44cfc2] hover:text-black transition-colors duration-300 text-sm font-medium shadow-md hover:shadow-lg"
            >
              {page.name}
            </NavLink>
          ))}
        </div>

      </div>
    </section>
  );
}
