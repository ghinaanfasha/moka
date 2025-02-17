# Panduan Menjalankan Aplikasi Web

Aplikasi ini dibangun menggunakan **Node.js** dengan framework **Express.js**, css dengan Tailwind **Preline UI** dan database **MySQL**. Pengelolaan database menggunakan **XAMPP** (phpMyAdmin) dan **Sequelize CLI** untuk migrasi model dan seeder. Berikut adalah panduan lengkap untuk menjalankan aplikasi ini di lingkungan lokal Anda.

## Prasyarat

Sebelum memulai, pastikan Anda telah menginstal beberapa software berikut:

1. **Node.js** - Unduh dan instal dari [situs resmi Node.js](https://nodejs.org/).
2. **XAMPP** - Unduh dan instal dari [situs resmi XAMPP](https://www.apachefriends.org/index.html).
3. **Git** (opsional) - Unduh dan instal dari [situs resmi Git](https://git-scm.com/).

---

## Langkah-langkah Menjalankan Aplikasi

### 1. Clone Repository

Pertama, clone repositori ini ke komputer lokal Anda menggunakan perintah berikut:  
**git clone https://github.com/ghinaanfasha/moka.git**    
Jika Anda tidak menggunakan Git, Anda dapat mengunduh repositori ini dalam bentuk ZIP dan mengekstraknya.

### 2.Instal Dependencies

Setelah repositori berhasil di-clone atau diekstrak, buka folder proyek di terminal atau command prompt Anda. Kemudian, jalankan perintah berikut untuk menginstal semua dependencies yang diperlukan:  
**npm install**

### 3. Setup Database

1. Jalankan XAMPP: Buka XAMPP Control Panel dan start Apache serta MySQL.
2. Buat Database: Buka phpMyAdmin di browser Anda (biasanya di http://localhost/phpmyadmin), lalu buat database baru dengan nama **moka_db**.

### 4. Migrasi Database

Setelah database dibuat, jalankan perintah berikut untuk melakukan migrasi tabel-tabel yang diperlukan ke database:  
**npx sequelize-cli db:migrate**

### 5. Seed Data Awal

Untuk mengisi database dengan data awal, jalankan perintah berikut:  
**npx sequelize-cli db:seed:all**

### 6. Jalankan Aplikasi

Setelah semua langkah di atas selesai, Anda dapat menjalankan aplikasi dengan perintah:  
**npm start**  
Aplikasi akan berjalan di **http://localhost:3000**. Buka alamat tersebut di browser Anda.

### 7. Login ke Aplikasi

Anda dapat login ke aplikasi menggunakan akun admin berikut:  
**Username  : admin**  
**Password  : admin123**  

