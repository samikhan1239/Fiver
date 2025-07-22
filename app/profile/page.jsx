"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import GigCard from "../../components/GigCard";

export default function Profile() {
  const { user } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchGigs = async () => {
        try {
          const res = await fetch("/api/gigs");
          const data = await res.json();
          setGigs(data.filter((gig) => gig.userId._id === user._id));
          setLoading(false);
        } catch (error) {
          setLoading(false);
        }
      };
      fetchGigs();
    }
  }, [user]);

  if (!user) {
    return <div className="text-center mt-10">Please login to view your profile</div>;
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-6">Profile</h2>
      <div className="bg-white p-6 rounded shadow mb-6">
        <h3 className="text-xl font-semibold">{user.name}</h3>
        <p className="text-gray-600">{user.email}</p>
      </div>
      <h3 className="text-xl font-semibold mb-4">Your Gigs</h3>
      {loading ? (
        <p>Loading...</p>
      ) : gigs.length === 0 ? (
        <p>No gigs found. <a href="/gigs/create" className="text-blue-500">Create one</a>.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {gigs.map((gig) => (
            <GigCard key={gig._id} gig={gig} />
          ))}
        </div>
      )}
    </div>
  );
}