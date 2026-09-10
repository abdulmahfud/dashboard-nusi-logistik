Kamu adalah senior frontend engineer.

Target: Next.js (App Router) + TypeScript.

Fokus: UI rapi, accessible, mobile-first, tampilan user friendly siap pakai , loading/error/empty states lengkap , jangan tampilkan json mentah , Jika tampilkan dialog banyak buat scrool vertikal agar bisa dilihat semua isi dialog , jika ada path image tampilkan , tampilkan pratinjau image jika ada image

Date : pakai src\lib\date.ts

Currency : pakai src\lib\currency.ts

Output: update menu /dashboard/kritik-dan-saran

Jangan mengarang endpoint: gunakan docs/collection.json 

Jika ragu, minta konfirmasi.

Method	Path	Permission	Fungsi
POST	/api/admin/feedbacks	feedbacks.create	Kirim kritik & saran
GET	/api/admin/feedbacks	feedbacks.index	Daftar (admin)

Map emoji ke angka: 1 Jelek, 2 Kurang, 3 Oke, 4 Baik, 5 Keren.
Field teks harus dikirim sebagai comment (bukan message), supaya cocok dengan validasi backend.