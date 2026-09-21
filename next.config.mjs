/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // URL lama "Tiket Bantuan" (dulu di bawah /tickets sehingga "Tiket Masuk"
      // ikut terdeteksi aktif). Tanpa ini, "new" akan dibaca sebagai id tiket.
      {
        source: "/dashboard/support/tickets/new",
        destination: "/dashboard/support/tiket-bantuan",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
