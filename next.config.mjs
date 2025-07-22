/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // Allow all paths under res.cloudinary.com
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**", // Allow all paths under images.pexels.com
      },
    ],
  },
};

export default nextConfig;