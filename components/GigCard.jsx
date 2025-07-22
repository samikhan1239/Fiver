import Link from "next/link";
import Image from "next/image";

export default function GigCard({ gig }) {
  return (
    <Link href={`/gigs/${gig._id}`}>
      <div className="bg-white rounded shadow p-4 hover:shadow-lg transition">
        {gig.image && (
         <Image
  src={gig.image}
  alt={gig.title}
  width={800} // Adjust width to match layout
  height={192} // h-48 = 192px
  className="w-full h-48 object-cover rounded mb-4"
/>
        )}
        <h3 className="text-lg font-semibold">{gig.title}</h3>
        <p className="text-gray-600 truncate">{gig.description}</p>
        <p className="text-green-600 font-bold mt-2">₹{gig.price}</p>
        <p className="text-sm text-gray-500">By: {gig.userId?.name || "Unknown"}</p>
      </div>
    </Link>
  );
}