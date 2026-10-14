"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";

export default function BantuanPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="container mx-auto p-6">
          <div className="bg-white rounded shadow p-6 overflow-x-auto text-sm prose max-w-none">
            <h1>Syarat &amp; Ketentuan BhisaKirim</h1>
            <br />
            <h2>A. Pendahuluan</h2>
            <br />
            <p>
              Selamat datang di BhisaKirim — platform agregator jasa pengiriman
              dari berbagai kurir terpercaya di Indonesia. Dengan menggunakan
              aplikasi atau situs BhisaKirim, Anda menyetujui syarat dan
              ketentuan yang ditetapkan demi kenyamanan dan keamanan Anda dalam
              menggunakan layanan kami. Harap membaca seluruh ketentuan ini
              dengan saksama sebelum menggunakan layanan BhisaKirim.
            </p>
            <br />
            <h2>B. Ketentuan Umum</h2>
            <br />
            <ol className="list-decimal ml-6">
              <li>
                BhisaKirim adalah platform digital yang menghubungkan pengguna
                dengan berbagai mitra ekspedisi untuk pengiriman paket.
              </li>
              <li>
                Layanan kami tidak mencakup jasa pengangkutan secara langsung,
                melainkan pengelolaan pemesanan dan pelacakan melalui mitra
                ekspedisi pilihan Anda.
              </li>
              <li>
                Dengan mendaftar, pengguna dianggap telah memahami dan
                menyetujui seluruh syarat, kebijakan privasi, dan pedoman
                penggunaan layanan BhisaKirim.
              </li>
            </ol>
            <br />
            <h2>C. Penggunaan Platform</h2>
            <br />
            <ol className="list-decimal ml-6">
              <li>
                <b>Akun Pengguna</b>
                <ul className="list-disc ml-6">
                  <li>
                    Pengguna wajib mendaftar menggunakan data pribadi yang valid
                    dan bertanggung jawab atas kerahasiaan akun masing-masing.
                  </li>
                  <li>
                    BhisaKirim tidak bertanggung jawab atas penyalahgunaan akun
                    oleh pihak ketiga karena kelalaian pengguna.
                  </li>
                </ul>
              </li>
              <li>
                <b>Keamanan Data</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim tidak akan meminta password, OTP, atau data
                    pribadi melalui saluran tidak resmi.
                  </li>
                  <li>
                    Pengguna wajib segera melaporkan jika terjadi dugaan
                    penyalahgunaan akun.
                  </li>
                </ul>
              </li>
              <li>
                <b>Pemutusan Layanan</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim berhak menangguhkan atau menghapus akun secara
                    sepihak jika ditemukan pelanggaran syarat layanan atau
                    aktivitas yang mencurigakan.
                  </li>
                </ul>
              </li>
            </ol>
            <br />
            <h2>D. Layanan BhisaKirim</h2>
            <br />
            <ol className="list-decimal ml-6">
              <li>
                <b>Akun Reguler dan Akun Terverifikasi</b>
                <ol className="list-decimal ml-6">
                  <li>
                    <b>Akun Reguler</b>
                    <ul className="list-disc ml-6">
                      <li>
                        Pengguna dengan status Akun Reguler dapat menggunakan
                        layanan pengiriman non-COD (Cash on Delivery).
                      </li>
                      <li>
                        Pembayaran layanan non-COD dapat dilakukan melalui
                        berbagai metode pembayaran elektronik, seperti e-wallet
                        (Dana, LinkAja, OVO, Gopay), atau QRIS.
                      </li>
                      <li>
                        Akun Reguler memiliki akses untuk melakukan pelacakan
                        (tracking) paket dan melihat riwayat pengiriman yang
                        telah dilakukan melalui aplikasi BhisaKirim.
                      </li>
                      <li>
                        Untuk mengaktifkan layanan COD, pengguna wajib melakukan
                        proses verifikasi agar status akunnya berubah menjadi
                        Akun Terverifikasi.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <b>Akun Terverifikasi</b>
                    <ul className="list-disc ml-6">
                      <li>
                        Untuk memperoleh status Akun Terverifikasi, pengguna
                        wajib melakukan verifikasi identitas dengan mengunggah:
                        <ul className="list-disc ml-6">
                          <li>Foto KTP asli (bukan fotokopi), dan</li>
                          <li>
                            Nomor rekening bank atas nama yang sama dengan
                            pemilik KTP.
                          </li>
                        </ul>
                      </li>
                      <li>
                        Jika pendaftaran dilakukan oleh badan usaha (PT/CV),
                        maka verifikasi dapat menggunakan:
                        <ul className="list-disc ml-6">
                          <li>Foto NPWP perusahaan, dan</li>
                          <li>
                            Nomor rekening perusahaan yang terdaftar resmi.
                          </li>
                        </ul>
                      </li>
                      <li>
                        Akun Terverifikasi memiliki akses penuh terhadap layanan
                        pengiriman dengan metode COD.
                      </li>
                      <li>
                        Keunggulan Akun Terverifikasi mencakup pengiriman barang
                        dengan metode pembayaran di tempat (COD) serta kecepatan
                        dalam proses pencairan dana dari hasil pengiriman COD.
                      </li>
                    </ul>
                  </li>
                </ol>
              </li>
              <li>
                <b>Pengiriman Barang</b>
                <ul className="list-disc ml-6">
                  <li>
                    <b>Kewajiban Pengirim</b>
                    <ul className="list-disc ml-6">
                      <li>
                        Pengguna wajib mengemas barang kiriman dengan aman dan
                        layak guna menghindari kerusakan selama proses
                        pengangkutan.
                      </li>
                      <li>
                        BhisaKirim dan mitra ekspedisi berhak menolak pengiriman
                        apabila kemasan dianggap tidak memenuhi standar
                        keamanan.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <b>Perhitungan Berat dan Dimensi</b>
                    <ul className="list-disc ml-6">
                      <li>
                        Penagihan biaya pengiriman didasarkan pada perbandingan
                        antara berat aktual dan berat volumetrik (dimensi), mana
                        yang lebih besar.
                      </li>
                      <li>
                        Jika terjadi penyesuaian berat/dimensi oleh mitra
                        ekspedisi saat proses pengambilan atau pengantaran, maka
                        pengguna wajib menanggung selisih biaya yang timbul.
                      </li>
                      <li>
                        Berat akhir yang dikenakan adalah berat setelah dikemas
                        ulang oleh ekspedisi (jika ada proses repacking).
                      </li>
                    </ul>
                  </li>
                  <li>
                    <b>Isi dan Nilai Barang</b>
                    <ul className="list-disc ml-6">
                      <li>
                        Pengguna wajib mencantumkan isi dan nilai barang secara
                        jujur dan akurat pada saat membuat pesanan pengiriman.
                      </li>
                      <li>
                        Segala akibat hukum, denda, atau kerugian akibat
                        informasi barang yang tidak sesuai adalah tanggung jawab
                        penuh pengguna.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <b>Barang yang Tidak Diperbolehkan</b>
                    <ul className="list-decimal ml-6">
                      <li>
                        Barang berbahaya, mudah meledak, mudah terbakar, atau
                        beracun
                      </li>
                      <li>Obat-obatan terlarang, narkotika, psikotropika</li>
                      <li>Logam dan batu mulia (emas, perak, platinum)</li>
                      <li>Uang tunai, cek, surat berharga</li>
                      <li>Abu jenazah, tanaman atau hewan hidup</li>
                      <li>Barang curian atau hasil kejahatan</li>
                      <li>Barang cair dengan volume di atas 100 ml</li>
                    </ul>
                    <p>
                      Jika pengguna tetap mengirimkan barang terlarang tanpa
                      pemberitahuan, maka BhisaKirim dibebaskan dari segala
                      bentuk klaim, kerugian, tuntutan hukum, maupun penggantian
                      dalam bentuk apa pun.
                    </p>
                  </li>
                  <li>
                    <b>Tanggung Jawab dan Batasan</b>
                    <ul className="list-disc ml-6">
                      <li>
                        BhisaKirim tidak menjamin keberhasilan pengiriman
                        apabila terjadi hal di luar kendali, termasuk namun
                        tidak terbatas pada: bencana alam, kebakaran,
                        kecelakaan, mogok kerja, atau gangguan operasional mitra
                        ekspedisi.
                      </li>
                      <li>
                        Untuk pengiriman makanan atau barang dengan masa
                        kedaluwarsa kurang dari 2 bulan, BhisaKirim tidak
                        bertanggung jawab atas kerusakan produk selama
                        pengiriman.
                      </li>
                      <li>
                        BhisaKirim tidak bertanggung jawab atas kerugian tidak
                        langsung seperti kerugian usaha, kerugian finansial,
                        atau kehilangan keuntungan yang timbul akibat
                        keterlambatan atau kegagalan pengiriman.
                      </li>
                      <li>
                        Tanggung jawab BhisaKirim terbatas pada pengawasan
                        proses pemesanan dan pengiriman sampai paket dinyatakan
                        selesai (delivered) oleh mitra ekspedisi.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <b>Drop-off dan Area Pengiriman</b>
                    <ul className="list-disc ml-6">
                      <li>
                        Drop-off paket hanya dapat dilakukan di agen ekspedisi
                        yang berada di kecamatan sesuai input lokasi pengirim
                        pada aplikasi BhisaKirim.
                      </li>
                      <li>
                        Jika pengguna melakukan drop-off di luar kecamatan yang
                        tercantum, maka selisih ongkir akan dikenakan sebagai
                        biaya tambahan dan dipotong dari saldo pengguna.
                      </li>
                      <li>
                        BhisaKirim berhak menahan atau menunda pengiriman jika
                        terjadi ketidaksesuaian lokasi drop-off hingga pengguna
                        melunasi kekurangan biaya ongkir.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <b>Perselisihan Pengiriman</b>
                    <ul className="list-disc ml-6">
                      <li>
                        Setelah paket dinyatakan delivered oleh ekspedisi,
                        segala bentuk klaim atau perselisihan antara pengguna
                        (pengirim) dan penerima bukan merupakan tanggung jawab
                        BhisaKirim.
                      </li>
                      <li>
                        BhisaKirim dapat membantu sebagai mediator terbatas jika
                        dibutuhkan, namun tidak menjamin penyelesaian sengketa.
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ol>

            <br />
            <h2>Fraud dan Kecurangan</h2>
            <br />
            <ul className="list-disc ml-6">
              <li>
                BhisaKirim berhak membatalkan, menahan, atau mengembalikan
                pengiriman apabila ditemukan indikasi penipuan, penyalahgunaan
                layanan, atau pelanggaran hukum yang merugikan BhisaKirim atau
                mitra ekspedisi.
              </li>
              <li>
                Setiap aktivitas curang baik dari pihak pengirim maupun
                penerima akan dilaporkan dan ditindaklanjuti sesuai hukum
                yang berlaku.
              </li>
            </ul>

            <br />
            <h2>Perubahan dan Pembatalan</h2>
            <br />
            <ul className="list-disc ml-6">
              <li>
                <b>Perubahan Detail Pengiriman oleh Pengguna</b>
                <ul className="list-disc ml-6">
                  <li>
                    Pengguna dapat melakukan perubahan detail pengiriman
                    (alamat, jenis layanan, informasi penerima, dll.) sebelum
                    paket di-pickup atau belum drop-off.
                  </li>
                  <li>
                    Segala perubahan yang dilakukan setelah paket diproses oleh
                    ekspedisi tidak dapat dijamin akan diterapkan, dan
                    sepenuhnya menjadi kebijakan dari mitra ekspedisi yang
                    bersangkutan.
                  </li>
                  <li>
                    Perubahan data pengiriman yang mempengaruhi biaya (seperti
                    berat, dimensi, lokasi) akan dikenakan penyesuaian tarif
                    sesuai ketentuan yang berlaku.
                  </li>
                </ul>
              </li>
              <li>
                <b>Pembatalan Pengiriman oleh Pengguna</b>
                <ul className="list-disc ml-6">
                  <li>
                    Pengguna dapat melakukan pembatalan pesanan pengiriman
                    selama paket belum dipickup atau belum drop-off.
                  </li>
                  <li>
                    Jika pengguna telah membayar ongkos kirim di muka, maka dana
                    akan dikembalikan dalam bentuk saldo BhisaKirim maksimal 3
                    (tiga) hari kerja setelah pembatalan disetujui.
                  </li>
                  <li>
                    Jika pembatalan dilakukan setelah paket di-pickup atau
                    diproses oleh mitra ekspedisi, maka pengguna tidak berhak
                    atas pengembalian ongkos kirim.
                  </li>
                </ul>
              </li>
              <li>
                <b>Pembatalan oleh BhisaKirim</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim berhak membatalkan pengiriman secara sepihak
                    apabila ditemukan:
                    <ol className="list-decimal ml-6">
                      <li>Ketidaksesuaian data pengiriman</li>
                      <li>
                        Pelanggaran terhadap ketentuan pengiriman barang
                        terlarang
                      </li>
                      <li>Indikasi penipuan atau penyalahgunaan layanan</li>
                      <li>
                        Permintaan resmi dari mitra ekspedisi, penegak hukum,
                        atau regulasi
                      </li>
                    </ol>
                  </li>
                  <li>
                    Dalam pembatalan sepihak oleh BhisaKirim akibat pelanggaran
                    pengguna, tidak ada pengembalian biaya yang telah
                    dibayarkan.
                  </li>
                </ul>
              </li>
              <li>
                <b>Perubahan Syarat dan Ketentuan</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim berhak sewaktu-waktu melakukan perubahan terhadap
                    Syarat dan Ketentuan ini demi penyesuaian dengan regulasi,
                    kebijakan platform, atau kerja sama dengan mitra ekspedisi.
                  </li>
                  <li>
                    Perubahan akan diinformasikan melalui aplikasi atau media
                    resmi BhisaKirim dan berlaku efektif sejak tanggal yang
                    ditentukan.
                  </li>
                  <li>
                    Dengan tetap menggunakan layanan BhisaKirim setelah adanya
                    pembaruan, pengguna dianggap menyetujui Syarat dan Ketentuan
                    terbaru secara otomatis.
                  </li>
                </ul>
              </li>
            </ul>

            <br />
            <h2>
              Cash on Delivery (COD) dan Cash on Delivery Value (COD Value)
            </h2>
            <br />
            <ul className="list-disc ml-6">
              <li>
                <b>Definisi Layanan COD</b>
                <ul className="list-disc ml-6">
                  <li>
                    Cash on Delivery (COD) adalah metode pembayaran di mana
                    penerima membayar harga barang secara tunai kepada kurir
                    saat barang diterima.
                  </li>
                  <li>
                    Layanan COD hanya tersedia bagi Pengguna yang telah memiliki
                    Akun Terverifikasi, dan memenuhi ketentuan administratif
                    maupun keamanan dari BhisaKirim.
                  </li>
                  <li>
                    Metode ini hanya berlaku untuk transaksi barang yang telah
                    disetujui dan tidak termasuk barang-barang terlarang atau
                    bermasalah sebagaimana diatur dalam ketentuan pengiriman.
                  </li>
                </ul>
              </li>
              <li>
                <b>Proses Penarikan Dana COD (COD Value)</b>
                <ul className="list-disc ml-6">
                  <li>
                    Nilai uang yang diterima oleh kurir dari pelanggan saat
                    pengantaran akan menjadi COD Value dan akan dikumpulkan oleh
                    mitra ekspedisi yang bekerja sama dengan BhisaKirim.
                  </li>
                  <li>
                    COD Value akan ditransfer ke akun bank pengguna (pengirim)
                    maksimal 7–14 hari kerja setelah status pengiriman dinyatakan
                    delivered atau Proof of Delivery (POD) oleh sistem mitra
                    ekspedisi.
                  </li>
                  <li>
                    Lama proses pencairan dapat berbeda tergantung pada sistem
                    kerja dan proses verifikasi mitra ekspedisi, serta kebenaran
                    data rekening yang disampaikan pengguna.
                  </li>
                </ul>
              </li>
              <li>
                <b>Ketentuan dan Biaya Tambahan</b>
                <ul className="list-disc ml-6">
                  <li>
                    Layanan COD dapat dikenakan biaya layanan tambahan (COD Fee)
                    sesuai dengan ketentuan yang berlaku di BhisaKirim dan mitra
                    ekspedisi.
                  </li>
                  <li>
                    Biaya layanan COD akan secara otomatis dipotong dari jumlah
                    COD Value sebelum dana dikirim ke akun pengguna.
                  </li>
                  <li>
                    BhisaKirim berhak menyesuaikan skema biaya layanan COD
                    sewaktu-waktu sesuai kebijakan operasional atau perubahan
                    dari pihak ketiga (ekspedisi dan penyedia sistem
                    pembayaran).
                  </li>
                </ul>
              </li>
              <li>
                <b>Tanggung Jawab dan Risiko</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim hanya bertindak sebagai perantara layanan
                    agregator antara pengguna dan mitra ekspedisi, sehingga
                    tidak bertanggung jawab atas keterlambatan, kekeliruan, atau
                    kehilangan dana COD yang disebabkan oleh pihak ekspedisi.
                  </li>
                  <li>
                    Pengguna bertanggung jawab memastikan kebenaran informasi
                    produk, harga, dan rekening bank tujuan pencairan dana COD.
                  </li>
                  <li>
                    Segala bentuk perselisihan terkait transaksi COD setelah
                    status delivered atau POD menjadi tanggung jawab langsung
                    antara pengguna dan penerima barang.
                  </li>
                </ul>
              </li>
              <li>
                <b>Kecurangan dan Fraud</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim berhak melakukan pemblokiran sementara atau
                    permanen terhadap akun, serta menahan pencairan dana COD
                    jika ditemukan indikasi:
                    <ol className="list-decimal ml-6">
                      <li>Penggunaan data palsu</li>
                      <li>Transaksi fiktif</li>
                      <li>Pengiriman barang ilegal</li>
                      <li>
                        Penggunaan layanan untuk penipuan atau aktivitas
                        merugikan lainnya
                      </li>
                    </ol>
                  </li>
                  <li>
                    Dalam kasus yang melibatkan dugaan penipuan, dana COD dapat
                    dibekukan hingga hasil investigasi selesai atau sesuai
                    arahan aparat berwenang.
                  </li>
                </ul>
              </li>
            </ul>
            <br />
            <h3>Fee COD per Ekspedisi</h3>
            <br />
            <p>
              Besaran Fee COD: <b>5% dari total nilai transaksi</b> (dengan
              biaya minimal Rp2.500), berlaku untuk ekspedisi berikut: J&amp;T
              Express, ID Express, J&amp;T Cargo, POS Indonesia, JNE Express,
              SAP Express, Ninja Xpress, Lion Parcel, dan Anteraja.
            </p>
            <p>Layanan COD belum tersedia untuk: Paxel &amp; Go-Send.</p>
            <ul className="list-disc ml-6 mt-2">
              <li>
                Hitungan fee COD pada Platform BhisaKirim adalah sebagai
                berikut:
                <br />
                <b>
                  Fee COD = Fee COD sesuai ekspedisi x (Harga Barang + Ongkos
                  Kirim + Asuransi*)
                </b>
                <br />
                <i>*jika menggunakan fitur asuransi</i>
              </li>
              <li>
                COD Value merupakan nilai COD yang ditagihkan dan dibayarkan
                oleh penerima kepada kurir mitra ekspedisi. Nilai yang akan
                ditagihkan adalah sebagai berikut:
                <br />
                <b>
                  COD Value = Harga Barang + Ongkos Kirim + Asuransi* + Fee COD
                </b>
                <br />
                <i>*jika menggunakan fitur asuransi</i>
              </li>
              <li>
                Minimal COD Value pada platform untuk seluruh ekspedisi yang
                melayani COD adalah senilai Rp10.000 dan maksimal
                Rp1.000.000.
              </li>
            </ul>

            <br />
            <h2>Retur</h2>
            <br />
            <p>
              Retur merupakan proses atau mekanisme pengembalian paket dari
              penerima ke pengirim. Apabila paket yang dikirimkan terjadi retur,
              maka pengirim tetap dikenakan biaya pengiriman 100% (seratus
              persen), tanpa diskon dan/atau harga coret, sesuai dengan
              ketentuan yang berlaku pada masing-masing ekspedisi saat barang
              diberangkatkan. Biaya retur akan dikenakan sesuai dengan ketentuan
              ekspedisi berikut:
            </p>
            <br />
            <div className="overflow-x-auto">
              <table className="min-w-full border text-xs">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Ekspedisi</th>
                    <th className="border px-2 py-1">Fee Retur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1">J&amp;T Express</td>
                    <td className="border px-2 py-1">
                      100% dari biaya ongkos pulang*
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">ID Express</td>
                    <td className="border px-2 py-1">
                      Tidak dipungut biaya retur
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">J&amp;T Cargo</td>
                    <td className="border px-2 py-1">
                      60% dari biaya ongkos kirim
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Paxel</td>
                    <td className="border px-2 py-1">
                      100% dari biaya ongkos kirim
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">POS Indonesia</td>
                    <td className="border px-2 py-1">
                      100% dari biaya ongkos kirim
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">JNE</td>
                    <td className="border px-2 py-1">
                      50% dari biaya ongkos kirim
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">SAP Express</td>
                    <td className="border px-2 py-1">
                      Tidak dipungut biaya retur
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Ninja Xpress</td>
                    <td className="border px-2 py-1">
                      Tidak dipungut biaya retur
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Lion Parcel</td>
                    <td className="border px-2 py-1">
                      100% dari biaya ongkos kirim
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Go-Send</td>
                    <td className="border px-2 py-1">
                      Tidak dipungut biaya retur
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Anteraja</td>
                    <td className="border px-2 py-1">
                      Tidak dipungut biaya retur
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <br />
            <h3>Ketentuan Rasio Return Maksimal</h3>
            <br />
            <p>
              Sebagai bagian dari komitmen kami untuk menjaga kualitas
              layanan dan kepercayaan seluruh pihak yang terlibat (terutama
              ekspedisi dan pelanggan akhir), BhisaKirim menetapkan batas
              maksimal rasio pengembalian (return rate) untuk setiap
              pengguna, mitra, atau merchant aktif.
            </p>
            <ul className="list-disc ml-6">
              <li>
                <b>Definisi Return</b> — status kiriman yang tidak berhasil
                diterima oleh penerima karena alasan tertentu, termasuk
                namun tidak terbatas pada:
                <ul className="list-disc ml-6">
                  <li>Penerima tidak berada di tempat</li>
                  <li>Alamat tidak lengkap atau tidak ditemukan</li>
                  <li>Penolakan oleh penerima</li>
                  <li>Barang rusak saat proses pengiriman</li>
                </ul>
              </li>
              <li>
                <b>Batas Maksimal Return</b> — rasio return maksimal yang
                diperbolehkan adalah 15% dari total value ongkir
                pengiriman. Artinya, dari seluruh transaksi value ongkir
                pengiriman yang dilakukan oleh pengguna, maksimal 15% dan
                akan dipotong dari saldo akun user.
              </li>
              <li>
                <b>Konsekuensi Jika Melebihi Batas</b> — jika dalam satu
                periode pengguna melebihi rasio return yang telah
                ditentukan, maka:
                <ul className="list-disc ml-6">
                  <li>
                    Peringatan resmi akan dikirimkan via email dan
                    dashboard pengguna.
                  </li>
                  <li>
                    Tinjauan akun akan dilakukan untuk melihat potensi
                    fraud, penyalahgunaan sistem, atau ketidaksesuaian data
                    pengiriman.
                  </li>
                  <li>
                    Penangguhan sementara fitur tertentu, seperti layanan
                    COD atau pencairan dana, sampai adanya pembayaran biaya
                    return.
                  </li>
                  <li>
                    Pemutusan kerja sama secara sepihak apabila rasio
                    return tidak diperbaiki segera.
                  </li>
                </ul>
              </li>
            </ul>

            <br />
            <h2>Pengajuan Klaim Barang Rusak atau Hilang</h2>
            <br />
            <ul className="list-disc ml-6">
              <li>
                <b>Definisi Klaim</b>
                <ul className="list-disc ml-6">
                  <li>
                    Klaim adalah proses permohonan ganti rugi yang diajukan oleh
                    Member (pengirim) kepada BhisaKirim atas barang kiriman yang
                    mengalami kerusakan atau kehilangan selama proses pengiriman
                    oleh mitra ekspedisi.
                  </li>
                  <li>
                    Klaim hanya berlaku untuk barang yang dikirim melalui
                    BhisaKirim dan tercatat secara resmi pada sistem.
                  </li>
                </ul>
              </li>
              <li>
                <b>Syarat Pengajuan Klaim</b>
                <ul className="list-disc ml-6">
                  <li>
                    Klaim hanya dapat diajukan oleh Member yang melakukan
                    pengiriman, bukan oleh penerima barang.
                  </li>
                  <li>
                    Klaim harus diajukan dalam jangka waktu maksimal 3 x 24 jam
                    sejak status pengiriman menyatakan &quot;delivered&quot;
                    (barang telah diterima) atau sejak Member menerima
                    notifikasi kerusakan/hilang dari sistem.
                  </li>
                  <li>
                    Pengajuan klaim harus disertai bukti lengkap, termasuk namun
                    tidak terbatas pada:
                    <ul className="list-disc ml-6">
                      <li>
                        Foto barang sebelum dikirim dan setelah diterima (jika
                        rusak)
                      </li>
                      <li>Foto kemasan luar dan dalam</li>
                      <li>Resi pengiriman</li>
                      <li>Bukti nilai barang (invoice atau nota pembelian)</li>
                    </ul>
                  </li>
                </ul>
              </li>
              <li>
                <b>Ketentuan Penilaian Klaim</b>
                <ul className="list-disc ml-6">
                  <li>
                    Klaim akan diverifikasi oleh tim BhisaKirim dan/atau mitra
                    ekspedisi. Proses ini dapat memakan waktu maksimal 14 hari
                    kerja.
                  </li>
                  <li>
                    Klaim akan diproses jika ditemukan kelalaian pada pihak
                    ekspedisi, seperti kehilangan barang atau kerusakan akibat
                    penanganan yang tidak sesuai.
                  </li>
                </ul>
              </li>
              <li>
                <b>Batasan Ganti Rugi</b>
                <ul className="list-disc ml-6">
                  <li>
                    Besaran ganti rugi maksimal mengikuti ketentuan
                    masing-masing mitra ekspedisi dan tidak melebihi nilai
                    barang yang dikirim sebagaimana tercantum pada data
                    pengiriman.
                  </li>
                  <li>
                    Klaim atas barang-barang yang dilarang dikirim (sebagaimana
                    tercantum dalam Syarat &amp; Ketentuan) tidak akan diproses
                    dan sepenuhnya menjadi tanggung jawab pengirim.
                  </li>
                  <li>
                    BhisaKirim dan mitra ekspedisi tidak bertanggung jawab atas
                    kerusakan atau kehilangan barang akibat force majeure
                    (bencana alam, huru-hara, dan kondisi darurat lain).
                  </li>
                </ul>
              </li>
              <li>
                <b>Pengembalian Dana (Jika Disetujui)</b>
                <ul className="list-disc ml-6">
                  <li>
                    Jika klaim disetujui, penggantian dana akan dilakukan
                    melalui saldo BhisaKirim milik Member atau metode lain
                    sesuai kebijakan.
                  </li>
                  <li>
                    BhisaKirim berhak memotong biaya-biaya administratif sesuai
                    ketentuan yang berlaku.
                  </li>
                </ul>
              </li>
              <li>
                <b>Penolakan Klaim</b>
                <ul className="list-disc ml-6">
                  <li>
                    Klaim dapat ditolak apabila tidak memenuhi persyaratan,
                    melebihi batas waktu pengajuan, atau tidak disertai bukti
                    yang memadai.
                  </li>
                  <li>
                    Keputusan akhir atas klaim berada pada pihak BhisaKirim
                    dan/atau mitra ekspedisi dan bersifat final.
                  </li>
                </ul>
              </li>
            </ul>
            <br />
            <h3>Waktu Pelaporan Kehilangan/Rusak per Ekspedisi</h3>
            <br />
            <div className="overflow-x-auto">
              <table className="min-w-full border text-xs">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Ekspedisi</th>
                    <th className="border px-2 py-1">Hilang</th>
                    <th className="border px-2 py-1">Rusak</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1">J&amp;T Express</td>
                    <td className="border px-2 py-1">
                      7 hari dari dinyatakan hilang
                    </td>
                    <td className="border px-2 py-1">
                      2x24 jam dari paket diterima
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">ID Express</td>
                    <td className="border px-2 py-1">
                      14 hari dari dinyatakan hilang
                    </td>
                    <td className="border px-2 py-1">
                      2x24 jam dari paket diterima
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">J&amp;T Cargo</td>
                    <td className="border px-2 py-1">
                      5 hari kalender dari dinyatakan hilang
                    </td>
                    <td className="border px-2 py-1">
                      3 hari kalender dari paket diterima
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Paxel</td>
                    <td className="border px-2 py-1">
                      24 jam dari dinyatakan hilang
                    </td>
                    <td className="border px-2 py-1">
                      24 jam dari paket diterima
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">POS Indonesia</td>
                    <td className="border px-2 py-1">
                      15 hari kalender dari dinyatakan hilang
                    </td>
                    <td className="border px-2 py-1">
                      45 hari kalender dari paket diterima
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">JNE</td>
                    <td className="border px-2 py-1">
                      7 hari dari dinyatakan hilang
                    </td>
                    <td className="border px-2 py-1">
                      2x24 jam dari paket diterima
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">SAP Express</td>
                    <td className="border px-2 py-1">
                      30 hari dari dinyatakan hilang
                    </td>
                    <td className="border px-2 py-1">
                      2x24 jam dari paket diterima
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Ninja Xpress</td>
                    <td className="border px-2 py-1">
                      14 hari kerja dari dinyatakan hilang
                    </td>
                    <td className="border px-2 py-1">
                      14 hari kerja dari dinyatakan rusak
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Lion Parcel</td>
                    <td className="border px-2 py-1">
                      14 hari kerja dari dinyatakan hilang
                    </td>
                    <td className="border px-2 py-1">
                      14 hari kerja dari dinyatakan rusak
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Go-Send</td>
                    <td className="border px-2 py-1">
                      7 hari kalender dari paket dinyatakan hilang
                    </td>
                    <td className="border px-2 py-1">
                      7 hari kalender dari paket dinyatakan rusak
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Anteraja</td>
                    <td className="border px-2 py-1">
                      24 jam dari dinyatakan hilang
                    </td>
                    <td className="border px-2 py-1">
                      24 jam dari paket diterima
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <br />
            <h3>Waktu Jawaban Klaim Ekspedisi</h3>
            <br />
            <div className="overflow-x-auto">
              <table className="min-w-full border text-xs">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Ekspedisi</th>
                    <th className="border px-2 py-1">Waktu Jawaban Klaim</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1">J&amp;T Express</td>
                    <td className="border px-2 py-1">
                      14 hari kerja sejak klaim diajukan
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">ID Express</td>
                    <td className="border px-2 py-1">
                      7 hari kerja sejak klaim diajukan
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">J&amp;T Cargo</td>
                    <td className="border px-2 py-1">
                      3 hari kerja sejak klaim diajukan
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Paxel</td>
                    <td className="border px-2 py-1">
                      7 hari kerja sejak klaim diajukan
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">POS Indonesia</td>
                    <td className="border px-2 py-1">
                      7 hari kerja sejak klaim diajukan
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">JNE</td>
                    <td className="border px-2 py-1">
                      7 hari kalender sejak klaim diajukan
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">SAP Express</td>
                    <td className="border px-2 py-1">
                      6 bulan dari tanggal pengiriman
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Ninja Xpress</td>
                    <td className="border px-2 py-1">
                      14 hari kalender sejak klaim diajukan
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Lion Parcel</td>
                    <td className="border px-2 py-1">
                      7 hari kerja sejak klaim diajukan
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Go-Send</td>
                    <td className="border px-2 py-1">
                      7 hari kerja sejak klaim diajukan
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Anteraja</td>
                    <td className="border px-2 py-1">
                      3 hari kerja sejak klaim diajukan (atau 3–7 hari kerja
                      sejak dokumen klaim dinyatakan lengkap)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Klaim akan dibayarkan maksimal H+7 hari kerja sejak proses klaim
              disetujui oleh ekspedisi terkait.
            </p>

            <br />
            <h2>Asuransi</h2>
            <br />
            <ul className="list-disc ml-6">
              <li>
                <b>Ketersediaan Asuransi</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim menyediakan layanan asuransi pengiriman sebagai
                    perlindungan tambahan atas risiko kerusakan atau kehilangan
                    barang selama proses pengiriman melalui mitra ekspedisi.
                  </li>
                  <li>
                    Layanan asuransi ini bersifat opsional dan dapat dipilih
                    oleh Member pada saat melakukan pemesanan pengiriman melalui
                    aplikasi BhisaKirim.
                  </li>
                </ul>
              </li>
              <li>
                <b>Aktivasi Asuransi</b>
                <ul className="list-disc ml-6">
                  <li>
                    Asuransi hanya akan aktif jika Member secara sadar
                    mencentang atau memilih opsi asuransi saat melakukan
                    pengisian detail pengiriman dan telah membayar biaya premi
                    asuransi sesuai tarif yang ditentukan.
                  </li>
                  <li>
                    Jika Member tidak mengaktifkan layanan asuransi, maka barang
                    yang dikirim dianggap tidak diasuransikan, dan Member setuju
                    menanggung seluruh risiko yang mungkin timbul.
                  </li>
                </ul>
              </li>
              <li>
                <b>Nilai Pertanggungan</b>
                <ul className="list-disc ml-6">
                  <li>
                    Nilai barang yang diasuransikan harus dicantumkan secara
                    jujur dan benar oleh Member saat proses pengiriman.
                  </li>
                  <li>
                    BhisaKirim dan/atau mitra ekspedisi berhak menolak klaim
                    apabila ditemukan adanya ketidaksesuaian atau kecurangan
                    terhadap nilai barang yang diinputkan.
                  </li>
                  <li>
                    Nilai pertanggungan maksimal sesuai dengan nilai yang
                    dinyatakan dan tidak melebihi batas maksimum yang ditentukan
                    oleh mitra ekspedisi atau penyedia asuransi.
                  </li>
                </ul>
              </li>
              <li>
                <b>Pengecualian Asuransi</b>
                <ul className="list-disc ml-6">
                  <li>
                    Barang-barang yang dilarang atau dibatasi pengirimannya
                    sebagaimana disebutkan.
                  </li>
                  <li>Barang yang dikemas secara tidak layak</li>
                  <li>
                    Barang yang memiliki masa kedaluwarsa kurang dari 2 bulan
                  </li>
                  <li>
                    Kehilangan/kerusakan akibat force majeure (bencana alam,
                    kerusuhan, tindakan pihak ketiga yang tidak terduga)
                  </li>
                  <li>Barang cair lebih dari 100ml</li>
                  <li>
                    Barang dengan nilai fiktif atau tidak bisa dibuktikan nilai
                    riilnya dengan dokumen resmi
                  </li>
                </ul>
              </li>
              <li>
                <b>Proses Klaim Asuransi</b>
                <ul className="list-disc ml-6">
                  <li>
                    Klaim atas barang yang diasuransikan harus diajukan oleh
                    Member dalam waktu maksimal 3 x 24 jam setelah status
                    pengiriman menunjukkan &quot;delivered&quot; atau setelah
                    mendapat notifikasi kerusakan/hilang.
                  </li>
                  <li>
                    Pengajuan klaim wajib disertai dokumen pendukung seperti:
                    foto barang dan kemasan, bukti resi, serta dokumen pembelian
                    atau invoice.
                  </li>
                  <li>
                    Proses verifikasi klaim dapat memakan waktu hingga 14 hari
                    kerja dan keputusan dari BhisaKirim dan/atau mitra penyedia
                    asuransi bersifat final.
                  </li>
                </ul>
              </li>
              <li>
                <b>Pembayaran Ganti Rugi</b>
                <ul className="list-disc ml-6">
                  <li>
                    Jika klaim disetujui, dana penggantian akan dikirimkan ke
                    saldo akun BhisaKirim Member atau melalui metode yang
                    ditentukan oleh BhisaKirim, setelah dipotong biaya
                    administrasi (jika ada).
                  </li>
                </ul>
              </li>
            </ul>
            <br />
            <h3>Biaya Asuransi per Ekspedisi</h3>
            <br />
            <div className="overflow-x-auto">
              <table className="min-w-full border text-xs">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Ekspedisi</th>
                    <th className="border px-2 py-1">Biaya Asuransi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1">J&amp;T Express</td>
                    <td className="border px-2 py-1">0,2% dari harga barang</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">ID Express</td>
                    <td className="border px-2 py-1">0,2% dari harga barang</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">J&amp;T Cargo</td>
                    <td className="border px-2 py-1">0,2% dari harga barang</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Paxel</td>
                    <td className="border px-2 py-1">0,2% dari harga barang</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Anteraja</td>
                    <td className="border px-2 py-1">0,2% dari harga barang</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">POS Indonesia</td>
                    <td className="border px-2 py-1">
                      0,5% dari harga barang, min. Rp500
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">JNE</td>
                    <td className="border px-2 py-1">
                      &lt; Rp500.000: Rp2.500 (opsional)
                      <br />
                      &ge; Rp500.000 &amp; &lt; Rp2.000.000: Rp2.500 (wajib)
                      <br />
                      &ge; Rp2.000.000: 0,2% dari harga barang + Rp5.000 (wajib)
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">SAP Express</td>
                    <td className="border px-2 py-1">0,3% dari harga barang</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Ninja Xpress</td>
                    <td className="border px-2 py-1">
                      0,2775% dari harga barang, min. Rp2.775
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Lion Parcel</td>
                    <td className="border px-2 py-1">0,6% dari harga barang</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Go-Send</td>
                    <td className="border px-2 py-1">
                      Silver: Maks Rp5.000.000
                      <br />
                      Gold: Maks Rp10.000.000
                      <br />
                      Platinum: Maks Rp25.000.000
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <br />
            <h2>Nilai Penggantian Barang</h2>
            <br />
            <ul className="list-disc ml-6">
              <li>
                <b>Dasar Perhitungan Penggantian</b>
                <ul className="list-disc ml-6">
                  <li>
                    Nilai penggantian barang yang rusak atau hilang akan
                    ditentukan berdasarkan:
                  </li>
                  <ul className="list-disc ml-6">
                    <li>
                      Nilai deklarasi barang yang dicantumkan oleh Member saat
                      pengisian data pengiriman di aplikasi BhisaKirim.
                    </li>
                    <li>
                      Bukti pembelian/invoice resmi yang dapat diverifikasi
                      keabsahannya.
                    </li>
                    <li>
                      Kebijakan maksimum nilai penggantian dari masing-masing
                      mitra ekspedisi dan/atau penyedia asuransi, jika Member
                      menggunakan layanan asuransi.
                    </li>
                  </ul>
                </ul>
              </li>
              <li>
                <b>Barang Diasuransikan</b>
                <ul className="list-disc ml-6">
                  <li>
                    Jika Member menggunakan layanan asuransi dan klaim
                    disetujui:
                  </li>
                  <ul className="list-disc ml-6">
                    <li>
                      Nilai penggantian akan mengacu pada nilai barang yang
                      dideklarasikan, maksimal sesuai dengan ketentuan dari
                      penyedia asuransi.
                    </li>
                    <li>
                      Penggantian bisa dilakukan secara penuh atau proporsional,
                      tergantung hasil verifikasi atas kondisi barang dan
                      keabsahan klaim.
                    </li>
                  </ul>
                </ul>
              </li>
              <li>
                <b>Kondisi yang Menggugurkan Hak Penggantian</b>
                <ul className="list-disc ml-6">
                  <li>Member tidak berhak atas penggantian jika:</li>
                  <ul className="list-disc ml-6">
                    <li>
                      Barang yang dikirimkan termasuk dalam kategori barang
                      terlarang atau tidak diasuransikan.
                    </li>
                    <li>Tidak dapat menunjukkan bukti pembelian yang sah.</li>
                    <li>
                      Terjadi pengemasan yang tidak layak yang menyebabkan
                      kerusakan.
                    </li>
                    <li>
                      Klaim diajukan setelah melewati batas waktu maksimal
                      klaim.
                    </li>
                    <li>
                      Terbukti adanya unsur kecurangan atau penipuan dalam
                      pengajuan klaim.
                    </li>
                  </ul>
                </ul>
              </li>
              <li>
                <b>Mekanisme Pembayaran Penggantian</b>
                <ul className="list-disc ml-6">
                  <li>
                    Penggantian dana akan dilakukan melalui saldo akun
                    BhisaKirim milik Member.
                  </li>
                </ul>
              </li>
            </ul>
            <br />
            <h3>Nilai Penggantian Barang per Ekspedisi</h3>
            <br />
            <div className="overflow-x-auto">
              <table className="min-w-full border text-xs">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Ekspedisi</th>
                    <th className="border px-2 py-1">Asuransi</th>
                    <th className="border px-2 py-1">Non Asuransi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1">J&amp;T Express</td>
                    <td className="border px-2 py-1">
                      Maksimal Rp20.000.000 (barang), Rp2.000.000 (dokumen)
                    </td>
                    <td className="border px-2 py-1">
                      10x biaya kirim atau nilai barang, maksimal Rp1.000.000
                      (barang), Rp100.000 (dokumen)
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">ID Express</td>
                    <td className="border px-2 py-1">
                      Sesuai nilai barang, maksimal Rp20.000.000
                    </td>
                    <td className="border px-2 py-1">
                      10x biaya kirim atau nilai barang, maksimal Rp1.000.000
                      (barang), Rp100.000 (dokumen)
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">J&amp;T Cargo</td>
                    <td className="border px-2 py-1">
                      Sesuai nilai barang pada invoice (hingga batas maksimal
                      pertanggungan yang disetujui)
                    </td>
                    <td className="border px-2 py-1">
                      10x biaya kirim atau nilai barang, maksimal Rp1.000.000
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Paxel</td>
                    <td className="border px-2 py-1">
                      10x biaya kirim, maksimal Rp20.000.000
                    </td>
                    <td className="border px-2 py-1">
                      10x biaya kirim, maksimal Rp1.000.000
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">POS Indonesia</td>
                    <td className="border px-2 py-1">Sesuai harga barang</td>
                    <td className="border px-2 py-1">Sesuai harga barang</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">JNE</td>
                    <td className="border px-2 py-1">
                      Hilang diganti penuh; jika rusak, barang ditarik dan
                      diganti barang baru/uang.
                    </td>
                    <td className="border px-2 py-1">0-10x biaya kirim</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">SAP Express</td>
                    <td className="border px-2 py-1">
                      Senilai barang, maksimal Rp10.000.000
                    </td>
                    <td className="border px-2 py-1">
                      10x biaya kirim atau nilai barang, maksimal Rp1.000.000
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Ninja Xpress</td>
                    <td className="border px-2 py-1">Sesuai harga barang</td>
                    <td className="border px-2 py-1">
                      10x biaya ongkir atau maksimal Rp1.000.000
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Lion Parcel</td>
                    <td className="border px-2 py-1">
                      Sesuai harga barang atau maksimal Rp1.000.000.000
                    </td>
                    <td className="border px-2 py-1">
                      10x biaya kirim atau Rp1.000.000, mana yang terendah
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Go-Send</td>
                    <td className="border px-2 py-1">
                      Maksimal Rp10.000.000 (kecuali emas: Rp4.500.000)
                    </td>
                    <td className="border px-2 py-1">-</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">Anteraja</td>
                    <td className="border px-2 py-1">
                      Sesuai nilai barang pada resi/invoice, maksimal
                      Rp100.000.000 per resi
                    </td>
                    <td className="border px-2 py-1">
                      Maksimal Rp1.000.000 (non-dokumen), Rp100.000 (dokumen)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <br />
            <h2>Saldo Aktif</h2>
            <br />
            <ul className="list-disc ml-6">
              <li>
                <b>Pengertian Saldo Aktif</b>
                <ul className="list-disc ml-6">
                  <li>
                    Saldo Aktif adalah dana yang tersimpan dalam akun BhisaKirim
                    milik Member dan dapat digunakan untuk:
                  </li>
                  <ul className="list-disc ml-6">
                    <li>Pembayaran ongkos kirim pengiriman paket;</li>
                    <li>
                      Pembayaran biaya tambahan (misalnya kekurangan ongkir,
                      penyesuaian berat, biaya COD);
                    </li>
                    <li>
                      Pembayaran layanan lain yang tersedia dalam platform
                      BhisaKirim.
                    </li>
                  </ul>
                </ul>
              </li>
              <li>
                <b>Top-Up Saldo</b>
                <ul className="list-disc ml-6">
                  <li>
                    Member dapat melakukan pengisian Saldo Aktif (top-up)
                    melalui metode pembayaran yang tersedia di aplikasi seperti
                    e-wallet (Dana, OVO, LinkAja, Gopay), Virtual Account bank,
                    QRIS, dan metode lainnya yang tersedia.
                  </li>
                </ul>
              </li>
              <li>
                <b>Penggunaan Saldo Aktif</b>
                <ul className="list-disc ml-6">
                  <li>
                    Saldo Aktif hanya dapat digunakan untuk transaksi dalam
                    aplikasi BhisaKirim.
                  </li>
                  <li>
                    Saldo akan otomatis terpotong saat Member melakukan
                    permintaan layanan pengiriman atau transaksi lain yang
                    tersedia.
                  </li>
                  <li>
                    Apabila Saldo Aktif tidak mencukupi, maka sistem akan
                    meminta Member untuk melakukan top-up tambahan sebelum
                    transaksi dapat diproses.
                  </li>
                </ul>
              </li>
              <li>
                <b>Pemotongan Saldo Otomatis</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim berhak melakukan pemotongan Saldo Aktif Member
                    secara otomatis dalam kondisi tertentu, seperti:
                  </li>
                  <ul className="list-disc ml-6">
                    <li>
                      Penyesuaian biaya pengiriman akibat perbedaan
                      berat/dimensi aktual;
                    </li>
                    <li>
                      Biaya penalti atau denda akibat pelanggaran kebijakan;
                    </li>
                    <li>
                      Penggantian biaya retur, kesalahan input alamat, dan
                      hal-hal operasional lainnya.
                    </li>
                  </ul>
                  <li>
                    Pemotongan akan disertai notifikasi melalui aplikasi atau
                    email terdaftar Member.
                  </li>
                </ul>
              </li>
              <li>
                <b>Masa Berlaku dan Pengendapan Saldo</b>
                <ul className="list-disc ml-6">
                  <li>
                    Saldo Aktif tidak memiliki masa kedaluwarsa selama akun
                    aktif.
                  </li>
                  <li>
                    Dalam hal akun dinonaktifkan secara permanen oleh Member
                    atau oleh BhisaKirim karena pelanggaran, maka Saldo Aktif
                    yang tersisa dianggap hangus dan tidak dapat dikembalikan.
                  </li>
                </ul>
              </li>
              <li>
                <b>Penarikan Saldo</b>
                <ul className="list-disc ml-6">
                  <li>
                    Khusus untuk Member dengan Akun Terverifikasi yang menerima
                    pembayaran dari layanan COD, penarikan saldo dapat dilakukan
                    ke rekening bank terverifikasi.
                  </li>
                  <li>
                    Proses penarikan tunduk pada jadwal pembayaran dan ketentuan
                    teknis yang diatur dalam sistem BhisaKirim.
                  </li>
                </ul>
              </li>
            </ul>

            <br />
            <h2>Afiliasi</h2>
            <br />
            <ul className="list-disc ml-6">
              <li>
                <b>Program Afiliasi BhisaKirim</b>
                <ul className="list-disc ml-6">
                  <li>
                    Program Afiliasi BhisaKirim adalah program yang memberikan
                    kesempatan kepada Member untuk memperoleh komisi dengan cara
                    mempromosikan aplikasi BhisaKirim kepada pihak lain melalui
                    tautan afiliasi atau kode referral yang disediakan oleh
                    sistem.
                  </li>
                </ul>
              </li>
              <li>
                <b>Ketentuan Umum Afiliasi</b>
                <ul className="list-disc ml-6">
                  <li>
                    Setiap Member BhisaKirim berhak untuk mengikuti Program
                    Afiliasi setelah menyetujui syarat dan ketentuan yang
                    berlaku dalam sistem afiliasi.
                  </li>
                  <li>
                    Member akan menerima kode referral unik yang dapat dibagikan
                    kepada pengguna baru.
                  </li>
                  <li>
                    Komisi afiliasi akan diberikan apabila pengguna baru yang
                    mendaftar melalui kode referral berhasil melakukan transaksi
                    pengiriman dengan syarat tertentu yang ditentukan oleh
                    BhisaKirim (misalnya minimum jumlah transaksi atau nilai
                    pengiriman).
                  </li>
                </ul>
              </li>
              <li>
                <b>Bentuk Komisi Afiliasi</b>
                <ul className="list-disc ml-6">
                  <li>
                    Komisi afiliasi dapat diberikan dalam bentuk saldo aktif
                    BhisaKirim, potongan biaya pengiriman, atau bentuk benefit
                    lainnya sesuai kebijakan BhisaKirim.
                  </li>
                  <li>
                    Komisi tidak dapat diuangkan secara langsung, kecuali
                    dinyatakan sebaliknya dalam program khusus yang ditawarkan
                    BhisaKirim.
                  </li>
                </ul>
              </li>
              <li>
                <b>Pelarangan dan Penyalahgunaan</b>
                <ul className="list-disc ml-6">
                  <li>
                    Member dilarang menyebarkan kode referral secara tidak
                    wajar, termasuk namun tidak terbatas pada spam, iklan palsu,
                    atau manipulasi pendaftaran.
                  </li>
                  <li>
                    BhisaKirim berhak membatalkan komisi dan menonaktifkan akun
                    afiliasi jika ditemukan indikasi kecurangan atau pelanggaran
                    atas program ini.
                  </li>
                </ul>
              </li>
              <li>
                <b>Perubahan Program Afiliasi</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim berhak untuk mengubah, menghentikan, atau
                    menyesuaikan syarat dan ketentuan program afiliasi kapan
                    saja tanpa pemberitahuan terlebih dahulu. Member diimbau
                    untuk secara berkala memeriksa pembaruan yang tersedia
                    melalui aplikasi atau situs resmi.
                  </li>
                </ul>
              </li>
            </ul>

            <br />
            <h2>Promo BhisaKirim</h2>
            <br />
            <ul className="list-disc ml-6">
              <li>
                <b>Ketentuan Umum Promo</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim dapat menyelenggarakan promo dalam bentuk
                    potongan biaya kirim, cashback, atau bentuk lainnya kepada
                    pengguna dengan syarat dan ketentuan yang ditentukan secara
                    khusus untuk setiap program promo.
                  </li>
                  <li>
                    Promo hanya berlaku selama periode waktu yang ditentukan dan
                    dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.
                  </li>
                </ul>
              </li>
              <li>
                <b>Syarat Penggunaan Promo</b>
                <ul className="list-disc ml-6">
                  <li>
                    Promo hanya dapat digunakan oleh pengguna yang memenuhi
                    syarat yang telah ditetapkan (misalnya pengguna baru,
                    minimal transaksi, area pengiriman tertentu, dll).
                  </li>
                  <li>
                    Satu akun hanya dapat menggunakan satu kode promo untuk
                    setiap transaksi, kecuali ditentukan lain.
                  </li>
                  <li>
                    Promo tidak dapat digabungkan dengan promo lainnya atau
                    ditukar dengan uang tunai.
                  </li>
                </ul>
              </li>
              <li>
                <b>Pembatalan dan Penarikan Promo</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim berhak membatalkan penggunaan promo apabila
                    ditemukan adanya penyalahgunaan atau kecurangan, termasuk
                    namun tidak terbatas pada penggunaan ganda, pendaftaran akun
                    palsu, atau pelanggaran lainnya.
                  </li>
                  <li>
                    Promo yang telah digunakan tidak dapat diuangkan,
                    dipindahtangankan, atau diklaim ulang apabila transaksi
                    dibatalkan oleh pengguna atau sistem.
                  </li>
                </ul>
              </li>
              <li>
                <b>Perubahan Syarat Promo</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim memiliki wewenang penuh untuk mengubah,
                    memperpanjang, atau mengakhiri program promo kapan saja
                    tanpa pemberitahuan sebelumnya. Pengguna diharapkan
                    memeriksa informasi promo terbaru melalui aplikasi
                    BhisaKirim atau saluran resmi lainnya.
                  </li>
                </ul>
              </li>
            </ul>

            <br />
            <h2>Keamanan</h2>
            <br />
            <ul className="list-disc ml-6">
              <li>
                <b>Keamanan Informasi Pengguna</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim berkomitmen untuk menjaga dan melindungi keamanan
                    data pribadi pengguna sesuai dengan ketentuan
                    perundang-undangan yang berlaku di Indonesia.
                  </li>
                  <li>
                    Data yang Anda berikan kepada BhisaKirim, termasuk namun
                    tidak terbatas pada data identitas, transaksi, dan informasi
                    pembayaran, akan disimpan dengan standar keamanan sistem
                    informasi yang memadai.
                  </li>
                  <li>
                    BhisaKirim tidak akan memberikan atau menjual data pribadi
                    Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali
                    diwajibkan oleh hukum atau peraturan yang berlaku.
                  </li>
                </ul>
              </li>
              <li>
                <b>Tanggung Jawab Pengguna atas Keamanan Akun</b>
                <ul className="list-disc ml-6">
                  <li>
                    Anda bertanggung jawab untuk menjaga kerahasiaan akun,
                    termasuk nama pengguna dan kata sandi.
                  </li>
                  <li>
                    Segala aktivitas yang terjadi melalui akun Anda merupakan
                    tanggung jawab Anda sepenuhnya, termasuk transaksi yang
                    dilakukan tanpa sepengetahuan Anda.
                  </li>
                  <li>
                    Jika Anda mengetahui atau mencurigai adanya pelanggaran
                    keamanan atau penggunaan tidak sah atas akun Anda, harap
                    segera menghubungi layanan pelanggan BhisaKirim.
                  </li>
                </ul>
              </li>
              <li>
                <b>Upaya Pencegahan Penipuan dan Penyalahgunaan</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim secara aktif melakukan pemantauan terhadap
                    aktivitas yang mencurigakan atau terindikasi penipuan dan
                    memiliki hak untuk menonaktifkan akun, menahan saldo, atau
                    membatalkan transaksi apabila terdapat dugaan pelanggaran
                    terhadap keamanan sistem.
                  </li>
                  <li>
                    Pengguna dilarang keras melakukan manipulasi sistem,
                    termasuk namun tidak terbatas pada rekayasa transaksi,
                    penggunaan identitas palsu, atau penyalahgunaan fitur
                    aplikasi untuk kepentingan pribadi yang merugikan pihak
                    lain.
                  </li>
                </ul>
              </li>
              <li>
                <b>Keterbatasan Tanggung Jawab</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim tidak bertanggung jawab atas kerugian yang timbul
                    akibat kelalaian pengguna dalam menjaga keamanan informasi
                    akun pribadi, termasuk pembocoran data karena kelalaian
                    pengguna, akses tidak sah yang dilakukan oleh pihak ketiga,
                    atau penyalahgunaan akun oleh pihak lain.
                  </li>
                </ul>
              </li>
            </ul>

            <br />
            <h2>Kebijakan Penggunaan Data</h2>
            <br />
            <ul className="list-disc ml-6">
              <li>
                <b>Pengumpulan Data</b>
                <p>
                  BhisaKirim mengumpulkan data pribadi pengguna secara langsung
                  saat Anda mendaftar, menggunakan layanan, melakukan transaksi,
                  atau berinteraksi dengan sistem aplikasi/platform, termasuk
                  namun tidak terbatas pada:
                </p>
                <ul className="list-disc ml-6">
                  <li>
                    Nama lengkap, nomor telepon, alamat email, alamat
                    pengiriman;
                  </li>
                  <li>Nomor identitas (KTP) dan/atau NPWP;</li>
                  <li>Informasi rekening atau metode pembayaran;</li>
                  <li>
                    Riwayat pengiriman, tracking, serta aktivitas transaksi
                    lainnya.
                  </li>
                </ul>
              </li>
              <li>
                <b>Tujuan Penggunaan Data</b>
                <p>Data yang dikumpulkan akan digunakan untuk keperluan:</p>
                <ul className="list-disc ml-6">
                  <li>Verifikasi identitas dan kelayakan akun;</li>
                  <li>Pemrosesan dan pemantauan pengiriman barang;</li>
                  <li>Pengelolaan fitur dan layanan Cash on Delivery (COD);</li>
                  <li>
                    Pengembangan dan peningkatan kualitas layanan BhisaKirim;
                  </li>
                  <li>
                    Keperluan komunikasi terkait transaksi, promosi, dan
                    pembaruan layanan;
                  </li>
                  <li>
                    Kepatuhan terhadap regulasi dan kebijakan hukum yang
                    berlaku.
                  </li>
                </ul>
              </li>
              <li>
                <b>Penyimpanan dan Perlindungan Data</b>
                <ul className="list-disc ml-6">
                  <li>
                    Data pribadi Anda akan disimpan dengan sistem yang memiliki
                    standar keamanan tinggi dan hanya diakses oleh personel yang
                    memiliki wewenang.
                  </li>
                  <li>
                    Kami melakukan upaya teknis dan organisasional yang wajar
                    untuk mencegah kehilangan data, akses tidak sah, pengubahan,
                    atau pengungkapan data tanpa izin.
                  </li>
                </ul>
              </li>
              <li>
                <b>Berbagi Data kepada Pihak Ketiga</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim tidak menjual atau menyewakan data pribadi Anda
                    kepada pihak ketiga.
                  </li>
                  <li>
                    Namun, kami dapat berbagi data Anda kepada mitra pengiriman,
                    penyedia sistem pembayaran, serta pihak ketiga lainnya yang
                    memiliki hubungan langsung dengan penyelenggaraan layanan,
                    sepanjang diperlukan untuk memproses pengiriman, pembayaran,
                    atau pelayanan yang Anda gunakan.
                  </li>
                  <li>
                    Pengungkapan data dapat dilakukan jika diwajibkan oleh
                    hukum, perintah pengadilan, atau permintaan instansi
                    berwenang.
                  </li>
                </ul>
              </li>
              <li>
                <b>Hak Pengguna atas Data Pribadi</b>
                <p>Anda memiliki hak untuk:</p>
                <ol className="list-decimal ml-6">
                  <li>
                    Mengakses dan memperbarui data pribadi Anda yang disimpan di
                    platform;
                  </li>
                  <li>
                    Meminta penghapusan data pribadi (dengan konsekuensi
                    tertentu terkait layanan);
                  </li>
                  <li>
                    Menolak penggunaan data untuk keperluan pemasaran langsung,
                    dengan menghubungi tim layanan pelanggan kami.
                  </li>
                </ol>
              </li>
              <li>
                <b>Penerimaan Pengguna</b>
                <ul className="list-disc ml-6">
                  <li>
                    Dengan menggunakan layanan BhisaKirim, Anda menyetujui
                    pengumpulan, penggunaan, penyimpanan, dan pengungkapan data
                    pribadi sebagaimana dijelaskan dalam bagian ini.
                  </li>
                </ul>
              </li>
            </ul>

            <br />
            <h2>Ketentuan Lain</h2>
            <br />
            <ul className="list-disc ml-6">
              <li>
                <b>Pemisahan Ketentuan</b>
                <ul className="list-disc ml-6">
                  <li>
                    Apabila ada satu atau lebih ketentuan dalam Syarat dan
                    Ketentuan ini yang dianggap tidak sah, tidak berlaku, atau
                    tidak dapat diberlakukan menurut hukum yang berlaku, maka
                    ketentuan tersebut akan dipisahkan dari Syarat dan Ketentuan
                    ini, dan tidak mempengaruhi keabsahan serta keberlakuan
                    ketentuan lainnya.
                  </li>
                </ul>
              </li>
              <li>
                <b>Pelepasan Hak</b>
                <ul className="list-disc ml-6">
                  <li>
                    Apabila BhisaKirim tidak menegakkan atau menunda dalam
                    menegakkan hak atau ketentuan dalam Syarat dan Ketentuan
                    ini, hal tersebut tidak dianggap sebagai pelepasan hak, dan
                    tidak akan memengaruhi hak BhisaKirim untuk menegakkannya di
                    kemudian hari.
                  </li>
                </ul>
              </li>
              <li>
                <b>Hubungan Hukum</b>
                <ul className="list-disc ml-6">
                  <li>
                    Syarat dan Ketentuan ini tidak menciptakan hubungan
                    keagenan, kemitraan, joint venture, atau hubungan kerja
                    lainnya antara pengguna dan BhisaKirim. Anda tidak berwenang
                    untuk mengikat BhisaKirim dalam bentuk apapun.
                  </li>
                </ul>
              </li>
              <li>
                <b>Peralihan Layanan</b>
                <ul className="list-disc ml-6">
                  <li>
                    BhisaKirim berhak untuk mengalihkan sebagian atau seluruh
                    hak dan/atau kewajibannya berdasarkan Syarat dan Ketentuan
                    ini kepada afiliasi atau pihak ketiga lainnya tanpa
                    persetujuan terlebih dahulu dari pengguna.
                  </li>
                </ul>
              </li>
              <li>
                <b>Pemberitahuan Resmi</b>
                <ul className="list-disc ml-6">
                  <li>
                    Semua bentuk pemberitahuan atau komunikasi resmi dari
                    BhisaKirim kepada pengguna akan dilakukan melalui email,
                    aplikasi, atau saluran resmi lainnya. Pengguna disarankan
                    untuk selalu memantau kanal resmi untuk informasi terbaru.
                  </li>
                </ul>
              </li>
              <li>
                <b>Hukum yang Berlaku</b>
                <ul className="list-disc ml-6">
                  <li>
                    Syarat dan Ketentuan ini diatur dan ditafsirkan berdasarkan
                    hukum yang berlaku di Republik Indonesia. Setiap
                    perselisihan yang timbul sehubungan dengan penggunaan
                    layanan BhisaKirim akan diselesaikan secara musyawarah, dan
                    jika tidak tercapai, akan diselesaikan melalui jalur hukum
                    sesuai yurisdiksi yang berlaku.
                  </li>
                </ul>
              </li>
            </ul>

            <br />
            <h2>Hak Kekayaan Intelektual</h2>
            <br />
            <ul className="list-disc ml-6">
              <li>
                <b>Kepemilikan</b>
                <ul className="list-disc ml-6">
                  <li>
                    Seluruh hak kekayaan intelektual terkait aplikasi, sistem,
                    desain, logo, merek dagang, nama domain, konten, fitur, dan
                    teknologi yang digunakan dalam BhisaKirim adalah milik
                    eksklusif BhisaKirim dan/atau afiliasinya, dilindungi oleh
                    undang-undang yang berlaku di Republik Indonesia serta hukum
                    internasional yang relevan.
                  </li>
                </ul>
              </li>
              <li>
                <b>Pembatasan Penggunaan</b>
                <ul className="list-disc ml-6">
                  <li>
                    Anda tidak diperkenankan untuk menyalin, menggandakan,
                    memodifikasi, menerbitkan, mendistribusikan, menjual,
                    memanfaatkan secara komersial, atau menggunakan bagian
                    manapun dari platform BhisaKirim, baik secara keseluruhan
                    maupun sebagian, tanpa izin tertulis sebelumnya dari
                    BhisaKirim.
                  </li>
                </ul>
              </li>
              <li>
                <b>Lisensi Terbatas</b>
                <ul className="list-disc ml-6">
                  <li>
                    Dengan tunduk pada Syarat dan Ketentuan ini, BhisaKirim
                    memberikan kepada pengguna lisensi terbatas, tidak
                    eksklusif, tidak dapat dipindahtangankan, dan dapat
                    dibatalkan untuk mengakses dan menggunakan layanan hanya
                    untuk keperluan pribadi dan non-komersial sesuai dengan
                    fungsi normal dari platform.
                  </li>
                </ul>
              </li>
              <li>
                <b>Konten Pengguna</b>
                <ul className="list-disc ml-6">
                  <li>
                    Setiap konten, data, atau informasi yang diunggah,
                    dituliskan, atau dikirimkan oleh pengguna melalui platform
                    BhisaKirim tetap menjadi milik pengguna. Namun, dengan
                    mengunggah atau mengirimkan konten tersebut, pengguna
                    memberikan hak kepada BhisaKirim untuk menggunakan,
                    menyimpan, memodifikasi, dan menampilkan konten tersebut
                    sejauh diperlukan untuk penyelenggaraan layanan.
                  </li>
                </ul>
              </li>
              <li>
                <b>Pelanggaran</b>
                <ul className="list-disc ml-6">
                  <li>
                    Pelanggaran terhadap hak kekayaan intelektual BhisaKirim
                    dapat dikenakan sanksi perdata maupun pidana sesuai dengan
                    hukum yang berlaku. BhisaKirim berhak menindaklanjuti secara
                    hukum terhadap setiap pelanggaran yang terjadi.
                  </li>
                </ul>
              </li>
            </ul>

            <br />
            <h2>Hubungi Kami</h2>
            <br />
            <p>
              Jika Anda memiliki pertanyaan, masukan, keluhan, atau membutuhkan
              bantuan terkait penggunaan layanan BhisaKirim, Anda dapat
              menghubungi tim layanan pelanggan kami melalui salah satu saluran
              berikut:
            </p>
            <ul className="list-disc ml-6">
              <li>
                <b>Email:</b> support@bhisakirim.com
              </li>
              <li>
                <b>WhatsApp Layanan Pengguna:</b> +62 821-4132-213
              </li>
              <li>
                <b>Jam Operasional Layanan Pelanggan:</b>
                <ul className="list-disc ml-6">
                  <li>Senin – Jumat: 08.00 – 17.00 WIB</li>
                  <li>
                    Sabtu – Minggu &amp; Hari Libur Nasional: 09.00 – 17.00 WIB
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
