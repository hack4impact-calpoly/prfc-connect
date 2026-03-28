"use client";

import { useState } from "react";
import Image from "next/image";
import { mockMembers, isMockAdmin } from "@/lib/mock-members";

export default function MockPortalPage() {
  const [selectedMember, setSelectedMember] = useState(mockMembers[0]);
  const [email, setEmail] = useState(mockMembers[0].owneremail);
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (process.env.NODE_ENV === "production" && process.env.STAGING !== "true") {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p>Not available in production</p>
      </main>
    );
  }

  function handleMemberSelect(ownerid: number) {
    const member = mockMembers.find((m) => m.ownerid === ownerid);
    if (member) {
      setSelectedMember(member);
      setEmail(member.owneremail);
      setError("");
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("You must enter an email address and password.");
      return;
    }

    const member = mockMembers.find((m) => m.owneremail.toLowerCase() === email.toLowerCase());
    if (!member) {
      setError("No member found with that email address.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/dev/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerid: member.ownerid, isAdmin: isMockAdmin(member.ownerid) }),
    });

    if (!res.ok) {
      setLoading(false);
      setError("Failed to generate authentication token.");
      return;
    }

    const { token } = await res.json();

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/callback";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "token";
    input.value = token;
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  }

  const navItems = ["The Co-op", "News & Events", "Get Involved", "Join Now", "Donate", "Contact Us", "FAQ", "Login"];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-paso-light-brown bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Image
            src="/assets/logo.png"
            alt="Paso Robles Food Co-op Logo"
            className="h-14 w-auto"
            width={284}
            height={100}
            priority
          />
          <div className="text-right text-sm text-paso-accent-black">
            <p className="font-bold">For help or info, please contact us:</p>
            <p>
              E-Mail:{" "}
              <a href="mailto:info@pasofoodcooperative.com" className="font-bold text-prfc-blue underline">
                info@pasofoodcooperative.com
              </a>
            </p>
          </div>
        </div>
      </header>

      <nav className="bg-prfc-brown">
        <ul className="mx-auto flex max-w-4xl flex-wrap justify-center gap-1 px-6 py-2 text-sm font-semibold text-white">
          {navItems.map((item) => (
            <li key={item}>
              <span className="cursor-default rounded px-3 py-1.5 hover:bg-prfc-dark-brown">{item}</span>
            </li>
          ))}
        </ul>
      </nav>

      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="w-full max-w-sm">
          <p className="mb-3 text-center text-sm font-semibold text-prfc-red">
            You must be logged in to view this page.
          </p>

          <h1 className="mb-6 text-center text-xl font-bold text-paso-accent-black">
            Login to your Paso Food Co-op Member Account
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-paso-accent-black">
                Email Address:
              </label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className="w-full rounded border border-prfc-border px-3 py-2 text-sm focus:border-prfc-brown focus:outline-none focus:ring-1 focus:ring-prfc-brown"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm text-paso-accent-black">
                Password:
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-prfc-border px-3 py-2 text-sm focus:border-prfc-brown focus:outline-none focus:ring-1 focus:ring-prfc-brown"
              />
            </div>

            {error ? <p className="text-center text-sm text-prfc-red">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-prfc-brown py-2 text-sm font-semibold text-white hover:bg-prfc-dark-brown disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-1 text-sm">
            <a href="#" className="font-bold text-prfc-blue underline">
              Need an Account?
            </a>
            <a href="#" className="font-bold text-prfc-blue underline">
              Forgot Your Password?
            </a>
            <a href="#" className="font-bold text-prfc-blue underline">
              Contact Paso Food Co-op
            </a>
          </div>
        </div>

        <div className="mt-10 w-full max-w-sm">
          <details className="rounded border border-prfc-border bg-paso-grey p-4">
            <summary className="cursor-pointer text-sm font-semibold text-prfc-brown">
              Dev Tools - Quick Select Member
            </summary>

            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-prfc-dark-brown">Select Member</span>
                <select
                  value={selectedMember.ownerid}
                  onChange={(e) => handleMemberSelect(parseInt(e.target.value))}
                  className="rounded border border-prfc-border bg-white px-3 py-1.5 text-sm"
                >
                  {mockMembers.map((member) => (
                    <option key={member.ownerid} value={member.ownerid}>
                      {member.ownerid} - {member.ownername}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded bg-white p-3 text-xs text-prfc-dark-brown">
                <div>
                  <strong>Name:</strong> {selectedMember.ownername}
                </div>
                <div>
                  <strong>Email:</strong> {selectedMember.owneremail}
                </div>
                <div>
                  <strong>Owner ID:</strong> {selectedMember.ownerid}
                </div>
                <div>
                  <strong>Role:</strong> {isMockAdmin(selectedMember.ownerid) ? "Admin" : "Member"}
                </div>
              </div>
            </div>
          </details>
        </div>
      </main>

      <footer className="border-t border-prfc-border bg-white px-6 py-4">
        <p className="text-center text-sm text-paso-accent-black">
          {navItems.map((item, i) => (
            <span key={item}>
              <a href="#" className="hover:underline">
                {item}
              </a>
              {i < navItems.length - 1 ? " | " : ""}
            </span>
          ))}
        </p>
        <p className="mt-2 text-center text-xs text-prfc-border">
          Copyright &copy; 2013-2026 by Paso Robles Food Cooperative, Inc. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
