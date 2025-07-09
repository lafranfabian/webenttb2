// Import React dan dependensi
import React, { useEffect, useState } from 'react';
import supabase from '../utils/supabase';
import '../styles/TambahDosenModal.css'; // bisa dipisah jika ingin file khusus untuk jadwal

// Komponen modal untuk tambah/edit jadwal
export default function TambahJadwalModal({ onClose, onSuccess, existingData }) {
  // State untuk dropdown data dari database
  const [ruangList, setRuangList] = useState([]);
  const [matkulList, setMatkulList] = useState([]);
  const [dosenList, setDosenList] = useState([]);

  // State field form, isi default dari existingData jika mode edit
  const [hari, setHari] = useState(existingData?.hari || '');
  const [jamMulai, setJamMulai] = useState(existingData?.jam_mulai || '');
  const [ruangan, setRuangan] = useState(existingData?.ruangan_kode || '');
  const [matkulId, setMatkulId] = useState(existingData?.matkul_id || '');
  const [dosenId, setDosenId] = useState(existingData?.dosen_id || '');

  // Fetch data untuk dropdown (ruang, matkul, dosen) saat komponen pertama kali load
  useEffect(() => {
    const fetchAll = async () => {
      const [ruangRes, matkulRes, dosenRes] = await Promise.all([
        supabase.from('ruang_kelas').select('kode'),
        supabase.from('modules').select('id, name'),
        supabase.from('profiles').select('id, full_name').eq('role', 'dosen'),
      ]);

      if (ruangRes.data) setRuangList(ruangRes.data);
      if (matkulRes.data) setMatkulList(matkulRes.data);
      if (dosenRes.data) setDosenList(dosenRes.data);
    };
    fetchAll();
  }, []);

  // Membuat opsi dropdown waktu dari 07:30 sampai 20:00 setiap 30 menit
  const generateTimeOptions = () => {
  const options = []; // array untuk menampung hasil string waktu (seperti '07:30', '08:00', dst)
  let hour = 7;       // jam mulai: 07 (jam 7 pagi)
  let minute = 30;    // menit mulai: 30 (jadi mulai dari 07:30)

  // loop selama waktu masih di bawah jam 20:00 (8 malam)
  while (hour < 20 || (hour === 20 && minute === 0)) {
    const h = hour.toString().padStart(2, '0'); // ubah jam jadi string 2 digit (contoh: 7 -> '07')
    const m = minute.toString().padStart(2, '0'); // ubah menit jadi string 2 digit (contoh: 5 -> '05')

    options.push(`${h}:${m}`); // masukkan format "hh:mm" ke array, contoh: "07:30"

    minute += 30; // tambahkan 30 menit ke waktu sekarang

    // jika menit jadi 60, maka ubah jadi 0 dan jam ditambah 1
    if (minute === 60) {
      minute = 0;
      hour++;
    }
  }

  return options; // hasil akhir: array berisi jam seperti ["07:30", "08:00", ..., "20:00"]
};


  // Fungsi untuk menghitung jam selesai (durasi default = 150 menit)
  const hitungJamSelesai = (mulai) => {
    if (!mulai) return '';
    const [jam, menit] = mulai.split(':').map(Number);
    const totalMenit = jam * 60 + menit + 150;
    const jamSelesai = Math.floor(totalMenit / 60);
    const menitSelesai = totalMenit % 60;
    return `${jamSelesai.toString().padStart(2, '0')}:${menitSelesai.toString().padStart(2, '0')}`;
  };

  // Simpan hasil perhitungan jam selesai
  const jamSelesai = hitungJamSelesai(jamMulai);

  // Fungsi submit form (insert atau update jadwal)
  const handleSubmit = async () => {
    if (!hari || !jamMulai || !ruangan || !matkulId || !dosenId) {
      alert('Semua field wajib diisi');
      return;
    }

    // Payload yang akan disimpan ke database
    const payload = {
      hari,
      jam_mulai: jamMulai,
      jam_selesai: jamSelesai,
      ruangan_kode: ruangan,
      matkul_id: matkulId,
      dosen_id: dosenId,
    };

    // Jika mode edit
    const { error } = existingData
      ? await supabase.from('jadwal').update(payload).eq('id', existingData.id)
      : await supabase.from('jadwal').insert(payload); // mode tambah

    if (error) {
      alert('Gagal menyimpan data.');
      console.error(error);
    } else {
      alert('Jadwal berhasil disimpan.');
      onSuccess(); // trigger refresh di parent
      onClose();   // tutup modal
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="btn-close" onClick={onClose}>×</button>
        <h3 className="modal-title">{existingData ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>

        {/* Dropdown Hari */}
        <div className="form-group">
          <label>Hari:</label>
          <select value={hari} onChange={(e) => setHari(e.target.value)}>
            <option value="">Pilih Hari</option>
            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        {/* Dropdown Jam Mulai dan tampilkan jam selesai */}
        <div className="form-group">
          <label>Jam Mulai – Selesai:</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select value={jamMulai} onChange={(e) => setJamMulai(e.target.value)}>
              <option value="">Pilih Jam Mulai</option>
              {generateTimeOptions().map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
            <span style={{ fontWeight: 'bold' }}>–</span>
            <span>{jamSelesai || '00:00'}</span>
          </div>
        </div>

        {/* Dropdown Ruangan */}
        <div className="form-group">
          <label>Ruangan:</label>
          <select value={ruangan} onChange={(e) => setRuangan(e.target.value)}>
            <option value="">Pilih Ruangan</option>
            {ruangList.map((r) => (
              <option key={r.kode} value={r.kode}>{r.kode}</option>
            ))}
          </select>
        </div>

        {/* Dropdown Mata Kuliah */}
        <div className="form-group">
          <label>Mata Kuliah:</label>
          <select value={matkulId} onChange={(e) => setMatkulId(e.target.value)}>
            <option value="">Pilih Matkul</option>
            {matkulList.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Dropdown Dosen */}
        <div className="form-group">
          <label>Dosen Pengampu:</label>
          <select value={dosenId} onChange={(e) => setDosenId(e.target.value)}>
            <option value="">Pilih Dosen</option>
            {dosenList.map((d) => (
              <option key={d.id} value={d.id}>{d.full_name}</option>
            ))}
          </select>
        </div>

        {/* Tombol Simpan */}
        <div className="modal-actions">
          <button className="btn-submit" style={{ backgroundColor: 'green' }} onClick={handleSubmit}>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
