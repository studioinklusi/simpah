# Dokumen Jawaban Penjaringan Inovasi - Aplikasi SIMPAH

Dokumen ini berisi draf jawaban lengkap untuk mendaftarkan aplikasi **SIMPAH (Sistem Informasi Manajemen Pengelolaan Sampah)** pada ajang Penjaringan Inovasi Daerah.

## A. Bagian Isian Deskriptif (Proposal)

**1. Abstrak / Ringkasan Eksekutif**
SIMPAH (Sistem Informasi Manajemen Pengelolaan Sampah) merupakan platform digital berbasis cloud yang dirancang secara komprehensif untuk mentransformasi tata kelola data persampahan secara terintegrasi dari hulu ke hilir. Platform ini mengatasi keterbatasan sistem konvensional dengan menghadirkan mekanisme pencatatan data yang granular, mulai dari tingkat wilayah (Desa/Kecamatan) hingga tingkat pengambil keputusan di Kabupaten/Provinsi. Tidak hanya mengelola sampah domestik rumah tangga secara periodik, SIMPAH secara khusus mengintegrasikan pemantauan timbulan sampah non-domestik yang bersumber dari berbagai Fasilitas Umum (Fasum) seperti destinasi wisata, perhotelan, kawasan industri, hingga fasilitas publik lainnya. Dengan memanfaatkan teknologi Sistem Informasi Geografis (GIS) dan dashboard analitik interaktif, SIMPAH menyajikan visualisasi real-time perbandingan estimasi potensi timbulan sampah dengan volume sampah yang berhasil dikelola. Keandalan operasional sistem didukung oleh arsitektur keamanan Role-Based Access Control (RBAC) yang membagi wewenang akses pengguna (Dinas Lingkungan Hidup, Kecamatan, Kader Lapangan, dan Pengelola Fasum) secara presisi guna mencegah tumpang tindih data. SIMPAH juga mengusung pendekatan sosial lewat modul pemantauan kinerja kader persampahan. Fitur ini merekam kontribusi aktif kader secara objektif, menjadi landasan bagi pemerintah daerah dalam memberikan insentif berbasis data untuk meningkatkan motivasi partisipasi masyarakat secara berkesinambungan. Melalui data valid yang diperbarui secara real-time di database PostgreSQL terpusat dan aplikasi web yang responsif pada Cloud VPS, SIMPAH berfungsi sebagai decision support system untuk membantu merumuskan kebijakan alokasi armada, mengantisipasi overload Tempat Pembuangan Akhir (TPA), serta mempercepat target zero-waste. Inovasi ini didesain ramah pengguna bagi kader di lapangan, serta memiliki fleksibilitas tinggi untuk diadaptasi oleh berbagai pemerintah kota maupun kabupaten di seluruh wilayah Indonesia guna mendorong percepatan program sirkular ekonomi daerah tersebut.

**2. Latar Belakang**
Tata kelola sampah perkotaan dan daerah sering kali terbentur pada masalah klasik berupa fragmentasi data, lambatnya pelaporan, serta sistem pencatatan yang masih mengandalkan cara-cara manual. Dinas Lingkungan Hidup di berbagai wilayah kerap kali kesulitan merumuskan kebijakan taktis dan tepat sasaran karena tidak memiliki akses langsung terhadap data timbulan sampah secara aktual, real-time, dan granular. Selama ini, data persampahan dikumpulkan secara periodik menggunakan spreadsheet konvensional atau dokumen fisik berlapis. Metode tersebut rentan terhadap manipulasi, lambat didistribusikan untuk analisis instan, dan gagal memetakan detail sumber sampah di wilayah masing-masing. Masalah pelaporan ini diperparah oleh minimnya pengawasan terhadap kontribusi sampah non-domestik yang dihasilkan dari sektor Fasilitas Umum (Fasum) seperti destinasi wisata, industri lokal, dan perhotelan, yang volumenya sangat tinggi namun jarang terdokumentasi secara tertib. Sementara itu, program pelibatan masyarakat melalui kader-kader lingkungan di tingkat desa kerap kali bersifat temporer dan mudah kehilangan konsistensi karena tidak adanya instrumen apresiasi yang terukur. Tanpa adanya sistem perekaman jejak kinerja (track record) yang transparan, kontribusi nyata para kader di lapangan tidak dapat terpantau dengan objektif oleh dinas terkait, sehingga menghambat pemberian insentif yang proporsional. Kondisi ketimpangan informasi, inefisiensi birokrasi, dan lemahnya keterlibatan kader inilah yang melatarbelakangi pengembangan platform SIMPAH. Sebagai solusi digital terintegrasi, SIMPAH hadir memotong birokrasi pelaporan manual menjadi paperless, menyatukan seluruh pelaku ekosistem sampah mulai dari pengelola Fasum, kader desa, hingga dinas kebersihan dalam satu basis data cloud terpusat. Dengan dashboard pemetaan GIS interaktif dan sistem pelacakan kinerja kader, SIMPAH memastikan setiap data sampah terverifikasi demi terwujudnya tata kelola lingkungan yang bersih, sehat, dan berkelanjutan. Sistem ini juga memberikan ruang kolaborasi yang lebih transparan antara instansi pemerintah dengan swasta dalam rangka mewujudkan program tanggung jawab sosial lingkungan (CSR) yang terarah. Melalui digitalisasi ini, disparitas pelaporan data lapangan dapat ditekan hingga tingkat minimal, mendukung percepatan smart city di daerah.

**3. Maksud dan Tujuan**
**Maksud:** Mendigitalisasi tata kelola dan pelaporan persampahan agar lebih akurat, transparan, dan terintegrasi dari hulu ke hilir.
**Tujuan:**
- Menyediakan dashboard analitik real-time berbasis wilayah untuk pengambilan keputusan Dinas Lingkungan Hidup.
- Mengakomodasi pelaporan data sampah dari Fasilitas Umum secara terstruktur.
- Memberikan apresiasi berbasis data yang jelas terhadap kader-kader persampahan yang berprestasi melalui pelacakan aktivitas.

**4. Manfaat Inovasi**
Manfaat utama dari SIMPAH adalah efisiensi birokrasi dalam pelaporan data sampah, validitas data yang terjamin karena diinput langsung dari tingkat wilayah/kader, serta kemampuan pemerintah daerah untuk melakukan mitigasi penumpukan sampah melalui visualisasi dashboard yang memetakan disparitas antara potensi sampah dan kapasitas pengelolaan di tiap daerah.

**5. Keunggulan Inovasi**
Dibandingkan dengan sistem pelaporan yang ada (seperti SIPSN nasional), SIMPAH memiliki keunggulan berupa granularitas data yang lebih dalam, yakni mencakup pemetaan level wilayah/desa dan Fasum (industri/wisata) secara spesifik. Selain itu, terdapat fitur *gamifikasi* dan pemantauan kinerja untuk para kader pengelola sampah, yang mendorong partisipasi aktif masyarakat secara berkelanjutan. SIMPAH juga telah menggunakan infrastruktur cloud modern dengan akses responsif.

**6. Aspek Inovasi**
- **Aspek Teknologi:** Penggunaan dashboard analitik spasial (GIS), database terpusat di Cloud VPS (PostgreSQL), dan sistem RBAC yang fleksibel dan aman.
- **Aspek Tata Kelola:** Mempersingkat alur birokrasi pelaporan lingkungan hidup dari manual ke *paperless*.
- **Aspek Sosial-Ekonomi:** Memberdayakan dan meningkatkan partisipasi aktif masyarakat melalui pengakuan (rekognisi) atas kinerja kader pengelola persampahan tingkat wilayah.

**7. Penerapan Inovasi**
Inovasi ini diterapkan secara berjenjang melalui sistem berbasis web. Admin atau pengelola Fasilitas Umum dan para kader wilayah (desa/kecamatan) akan menginput data volume sampah secara periodik lewat platform SIMPAH. Data tersebut otomatis diagregasi dan ditampilkan di *dashboard* analitik milik Dinas/Pemerintah Daerah. Hak akses diatur sedemikian rupa agar setiap *role* (Dinas, Kecamatan, Kader, Pengelola Fasum) hanya mengakses dan memodifikasi data sesuai kewenangannya.

**8. Anggaran**
Total anggaran yang diajukan untuk penyediaan lisensi, kustomisasi skema database, infrastruktur Cloud VPS, pemeliharaan sistem, dan serah terima dokumen manual book aplikasi SIMPAH adalah **Rp 50.000.000,00 (Lima Puluh Juta Rupiah)** (termasuk PPN 11%). Pelatihan operasional dan sosialisasi ke tingkat kader diselenggarakan dan ditanggung oleh instansi pengguna (Dinas).

Dokumen RAB terperinci telah disusun dengan rincian sebagai berikut:
1. **Lisensi Sistem (1 Tahun):** Rp 22.045.000,00
2. **Kustomisasi & Setup Database:** Rp 12.000.000,00 (Setup database PostgreSQL di VPS & Dashboard Dinas)
3. **Infrastruktur Cloud & Server (1 Tahun):** Rp 6.000.000,00 (Sewa Cloud VPS Server, Domain Pemda, SSL)
4. **Instalasi, Pemeliharaan & Dokumentasi:** Rp 5.000.000,00 (CI/CD setup, pemeliharaan 1 tahun, Buku Panduan)
5. **PPN 11%:** Rp 4.955.000,00

*Rincian lengkap RAB tersedia pada dokumen [RAB_SIMPAH_50Juta.md](file:///u:/Project/simpah-rilis%20v1/docs/RAB_SIMPAH_50Juta.md) dan Word [RAB_SIMPAH_50Juta.docx](file:///u:/Project/simpah-rilis%20v1/docs/RAB_SIMPAH_50Juta.docx).*

---

## B. Orisinalitas dan Kepioniran

**1. Apakah temuan benar-benar asli milik saudara?**
Iya, inovasi ini merupakan karya asli yang dikembangkan dan disesuaikan (customized) secara penuh dari awal untuk menjawab spesifikasi masalah pengelolaan data persampahan di daerah ini.

**2. Apakah ide/inovasi hasil pengembangan sebelumnya? Apabila Jawaban "Iya" Pengembangan ada di bagian apa?**
Iya, inovasi ini adalah hasil pengembangan dari proses pencatatan sampah manual/parsial menggunakan spreadsheet. Pengembangannya terletak pada otomatisasi alur, pengintegrasian data ke dalam satu database terpusat (cloud), serta penambahan sistem dashboard analitik cerdas dan pelacakan kinerja kader lingkungan.

**3. Apakah ada inovasi sejenis? Jika ada apa perbedaan inovasi yang anda miliki?**
Ada (contohnya Sistem Informasi Pengelolaan Sampah Nasional/SIPSN). Perbedaan mendasarnya, SIPSN lebih berfokus pada data makro kabupaten/kota. SIMPAH memiliki spesifikasi data mikro di tingkat desa/wilayah, pelacakan potensi Fasilitas Umum (pabrik, hotel, wisata), dan berfokus pada fitur peningkatan engagement para kader pengelola sampah (melalui ranking performa).

---

## C. Penerapan di Masyarakat

**1. Apakah sudah dilakukan Ujicoba pada lingkungan yang relevan? Dimana dan Bagaimana hasil penerapannya?**
Sudah dilakukan uji coba pada tahap UAT (User Acceptance Testing) bersama pengguna, seperti dinas terkait dan pengelola sistem (sesuai demo uat). Hasilnya, alur penginputan data menjadi jauh lebih cepat dan pemantauan wilayah yang rawan tumpukan sampah dapat terdeteksi langsung melalui dashboard.

**2. Apakah inovasi yang di hasilkan sudah siap terapkan? Siapakah yang menerapkan?**
Sangat siap diterapkan (Production-ready). Sistem ini diterapkan oleh Pemerintah Daerah (Dinas Lingkungan Hidup / Dinas terkait) sebagai pemantau utama, dan dioperasionalkan oleh perangkat wilayah (Kecamatan/Desa), kader persampahan lokal, serta pengelola Fasum/Industri.

**3. Skala jangkauan penerapan pada skala apa (Nasional/Provinsi/Kab dan Kota/Kecamatan/Desa)?**
Skala penerapan berada di tingkat **Kabupaten/Kota**, namun dengan jangkauan sumber data yang sangat granular hingga ke skala **Kecamatan dan Desa/Wilayah**.

---

## D. Manfaat (Detail)

**1. Apakah inovasi yang dihasilkan dapat menyelesaikan permasalahan aktual saat ini? Jelaskan.**
Ya. Masalah aktual saat ini adalah lambatnya ketersediaan data persampahan lapangan (seringkali baru tersedia setiap akhir tahun). Dengan SIMPAH, rekapitulasi data sampah domestik maupun non-domestik bersifat aktual dan real-time, memungkinkan dinas terkait untuk langsung mengalokasikan armada angkut atau intervensi edukasi di wilayah tertentu.

**2. Apakah inovasi dapat meningkatkan proses produksi/efisiensi? Jelaskan.**
Ya, inovasi sangat meningkatkan efisiensi operasional. Sistem otomatisasi agregasi data menghapus kebutuhan rekapitulasi manual menggunakan kertas atau excel berlapis, sehingga menghemat waktu ratusan jam kerja para petugas administratif dalam setahun.

**3. Apakah memberi manfaat kelingkungan? Dalam bentuk apa?**
Tentu, bentuknya adalah **keterukuran**. Dengan data potensi timbulan sampah yang akurat dari setiap kawasan wisata dan industri (Fasum), pemerintah dapat mengukur beban sampah yang harus dikelola, mencegah terjadinya *overload* di TPA, dan menyusun program pengurangan sampah di sumber secara presisi untuk menekan pencemaran lingkungan lokal.

**4. Apakah menyerap tenaga kerja pada proses produksi? Berapa?**
Ya, pada aspek operasional lapangan, inovasi ini menyerap tenaga kerja dengan memberdayakan para kader pengelola lingkungan dan petugas entri data sampah di berbagai desa serta perusahaan. Jumlah tenaga terserap selaras dengan banyaknya desa yang tergabung di sistem.

**5. Apakah dapat meningkatkan pendapatan masyarakat? Berapa?**
Ya. Melalui modul pelacakan (tracking) kader terbaik, masyarakat/kader pengelola bank sampah atau fasilitas daur ulang mendapatkan visibilitas dan dapat menerima insentif atau program pendanaan yang tepat sasaran dari pemerintah karena kinerjanya terekam dengan valid, sehingga mendorong terbentuknya ekosistem sirkular ekonomi persampahan di desa tersebut.

---

## E. Keberlangsungan / Komersialisasi

**1. Berapa persen penyerapan penggunaan sumberdaya lokal (SDM dan Bahan baku lokal)?**
100% menggunakan sumber daya lokal. Sistem ini dikembangkan oleh talenta SDM lokal dan dioperasikan secara penuh oleh perangkat daerah beserta komunitas kader dan pengelola fasilitas di tingkat wilayah.

**2. Apakah ketersediaan bahan baku kontinyu secara kualitas dan kuantitas?**
Ya. Mengingat inovasi ini berupa perangkat lunak (*Software as a Service*), "bahan baku" yang diperlukan adalah akses internet, *cloud hosting* yang berkesinambungan, dan kelangsungan kegiatan pelayanan di lapangan. Selama Pemerintah Daerah menggunakannya untuk tata kelola, sistem akan berjalan secara kontinyu tanpa batas waktu.
