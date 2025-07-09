import React, { useState, useEffect } from 'react';
import '../styles/TambahDosenModal.css';
import supabase from '../utils/supabase';

// Komponen modal untuk menambahkan atau mengedit data dosen
export default function TambahDosenModal({ onClose, existingData }) {
  // State untuk daftar prodi dari database
  const [prodiList, setProdiList] = useState([]);

  // State untuk isian form, diisi dari existingData jika mode edit
  const [nama, setNama] = useState(existingData ? existingData.full_name : '');
  const [email, setEmail] = useState(existingData ? existingData.email : '');
  const [nip, setNip] = useState(existingData ? existingData.nip : '');
  const [selectedProdi, setSelectedProdi] = useState(existingData ? existingData.prodi_id : '');

  // Ambil daftar prodi saat komponen pertama kali dirender
  useEffect(() => {
    const fetchProdi = async () => {
      const { data, error } = await supabase.from('prodi').select();
      if (error) {
        console.error('Gagal fetch prodi:', error);
      } else {
        setProdiList(data); // simpan ke state
      }
    };
    fetchProdi();
  }, []);

  // Fungsi untuk menangani submit form (tambah atau update)
  const handleSubmit = async () => {
    // Validasi semua field wajib diisi
    if (!nama || !email || !nip || !selectedProdi) {
      alert('Semua field wajib diisi!');
      return;
    }

    if (existingData) {
      // === MODE EDIT DOSEN ===
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: nama,
          email: email,
          nip: nip,
          prodi_id: selectedProdi,
        })
        .eq('id', existingData.id); // cari berdasarkan ID user

      if (error) {
        console.error('Gagal update:', error);
        alert('Gagal update dosen!');
      } else {
        alert('Dosen berhasil diupdate!');
        onClose(); // tutup modal setelah selesai
      }
    } else {
      // === MODE TAMBAH DOSEN BARU ===

      // Step 1: Sign up akun auth dengan password = NIP
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password: nip,
      });

      if (signupError) {
        console.error('Gagal sign up:', signupError);
        alert('Gagal membuat akun dosen. Pastikan email belum terdaftar.');
        return;
      }

      // Step 2: Ambil ID user baru yang berhasil sign up
      const userId = signupData?.user?.id;
      if (!userId) {
        alert('Gagal mengambil ID user setelah sign up.');
        return;
      }

      // Step 3: Insert data tambahan ke tabel profiles
      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId,
        full_name: nama,
        email,
        nip,
        prodi_id: selectedProdi,
        role: 'dosen',
      });

      if (insertError) {
        console.error('Gagal insert profile:', insertError);
        alert('Gagal menyimpan data dosen.');
      } else {
        alert('Dosen berhasil ditambahkan.\nAkun login telah dibuat (Password = NIP)');
        onClose(); // tutup modal
      }
    }
  };

  // Tampilan UI modal
  return (
    <div className="modal-overlay"> {/* Overlay background */}
      <div className="modal-card"> {/* Kartu modal */}
        <button className="btn-close" onClick={onClose}>×</button> {/* Tombol tutup */}
        <h3 className="modal-title">{existingData ? 'Edit Dosen' : 'Tambah Dosen'}</h3>

        {/* Form input */}
        <label>Nama Lengkap:</label>
        <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} />

        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>NIP:</label>
        <input type="text" value={nip} onChange={(e) => setNip(e.target.value)} />

        <label>Prodi:</label>
        <select value={selectedProdi} onChange={(e) => setSelectedProdi(e.target.value)}>
          <option value="">-- Pilih Prodi --</option>
          {prodiList.map((prodi) => (
            <option key={prodi.id} value={prodi.id}>
              {prodi.nama}
            </option>
          ))}
        </select>

        {/* Tombol Submit */}
        <div className="modal-actions">
          <button className="btn-submit" onClick={handleSubmit}>
            {existingData ? 'Update' : 'Selesai'}
          </button>
        </div>
      </div>
    </div>
  );
}
