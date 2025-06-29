import React, { useState, useEffect } from 'react';
import '../styles/TambahDosenModal.css';
import supabase from '../utils/supabase';

export default function TambahDosenModal({ onClose, existingData }) {
  const [prodiList, setProdiList] = useState([]);
  const [nama, setNama] = useState(existingData ? existingData.full_name : '');
  const [email, setEmail] = useState(existingData ? existingData.email : '');
  const [nip, setNip] = useState(existingData ? existingData.nip : '');
  const [selectedProdi, setSelectedProdi] = useState(existingData ? existingData.prodi_id : '');

  useEffect(() => {
    const fetchProdi = async () => {
      const { data, error } = await supabase.from('prodi').select();
      if (error) {
        console.error('Gagal fetch prodi:', error);
      } else {
        setProdiList(data);
      }
    };
    fetchProdi();
  }, []);

  const handleSubmit = async () => {
    if (!nama || !email || !nip || !selectedProdi) {
      alert('Semua field wajib diisi!');
      return;
    }

    if (existingData) {
      // === MODE EDIT ===
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: nama,
          email: email,
          nip: nip,
          prodi_id: selectedProdi,
        })
        .eq('id', existingData.id);

      if (error) {
        console.error('Gagal update:', error);
        alert('Gagal update dosen!');
      } else {
        alert('Dosen berhasil diupdate!');
        onClose();
      }
    } else {
      // === MODE TAMBAH DOSEN BARU ===
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password: nip, // NIP sebagai password default
      });

      if (signupError) {
        console.error('Gagal sign up:', signupError);
        alert('Gagal membuat akun dosen. Pastikan email belum terdaftar.');
        return;
      }

      const userId = signupData?.user?.id;
      if (!userId) {
        alert('Gagal mengambil ID user setelah sign up.');
        return;
      }

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
        onClose();
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="btn-close" onClick={onClose}>×</button>
        <h3 className="modal-title">{existingData ? 'Edit Dosen' : 'Tambah Dosen'}</h3>

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

        <div className="modal-actions">
          <button className="btn-submit" onClick={handleSubmit}>
            {existingData ? 'Update' : 'Selesai'}
          </button>
        </div>
      </div>
    </div>
  );
}
