/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ігнорувати ESLint під час production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Опціонально: ігнорувати TypeScript помилки
    ignoreBuildErrors: false,
  },
}

export default nextConfig
