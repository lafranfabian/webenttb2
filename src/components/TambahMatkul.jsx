import React, { useEffect, useState } from 'react';
import '../styles/TambahDosenModal.css'; // CSS modal digunakan ulang
import supabase from '../utils/supabase';

// Komponen utama untuk menambah atau mengedit data mata kuliah
export default function TambahMatkulModal({ onClose, onSuccess, existingData }) {
  // State untuk form input
  const [name, setName] = useState(existingData?.name || '');
  const [code, setCode] = useState(existingData?.code || '');
  const [sks, setSks] = useState(existingData?.sks?.toString() || '');
  const [prodiId, setProdiId] = useState(existingData?.prodi_id?.toString() || '');
  const [prodiList, setProdiList] = useState([]); // Daftar semua prodi dari database

  // Ambil data prodi saat komponen dimuat
  useEffect(() => {
    const fetchProdi = async () => {
      const { data, error } = await supabase.from('prodi').select();
      if (error) {
        console.error('Gagal mengambil prodi:', error.message);
        return;
      }

      // Tambahkan 'Mata Kuliah Umum' jika belum ada (id = 0)
      const sudahAdaUmum = data.some(p => p.id === 0);
      const list = sudahAdaUmum ? data : [{ id: 0, nama: 'Mata Kuliah Umum', kode: 'UMUM' }, ...data];
      setProdiList(list);
    };
    fetchProdi();
  }, []);

  // Fungsi ketika tombol submit ditekan
  const handleSubmit = async () => {
    // Validasi form wajib isi
    if (!name || !code || !sks || !prodiId) {
      alert('Semua field wajib diisi.');
      return;
    }

    // Persiapkan payload (data yang akan disimpan)
    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(), // Kode diubah jadi huruf kapital
      sks: parseInt(sks),
      prodi_id: parseInt(prodiId),
    };

    // Cek duplikasi kode mata kuliah
    const { data: existing, error: checkError } = await supabase
      .from('modules')
      .select('id')
      .eq('code', payload.code);

    if (checkError) {
      console.error('Gagal cek kode:', checkError.message);
      alert('Terjadi kesalahan saat memeriksa kode.');
      return;
    }

    // Jika duplikat ditemukan dan bukan matkul yang sedang diedit
    const isDuplikat = existing.length > 0 && (!existingData || existing[0].id !== existingData.id);
    if (isDuplikat) {
      alert('Kode mata kuliah sudah digunakan.');
      return;
    }

    let error;
    // Update atau insert sesuai mode
    if (existingData) {
      ({ error } = await supabase.from('modules').update(payload).eq('id', existingData.id));
    } else {
      ({ error } = await supabase.from('modules').insert(payload));
    }

    // Tampilkan alert sesuai hasil
    if (error) {
      console.error('Gagal menyimpan:', error.message);
      alert('Gagal menyimpan mata kuliah.');
    } else {
      alert(existingData ? 'Mata kuliah berhasil diperbarui' : 'Mata kuliah berhasil ditambahkan');
      onSuccess(); // Refresh data di halaman sebelumnya
      onClose();   // Tutup modal
    }
  };

  // Tampilan form modal
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="btn-close" onClick={onClose}>×</button>
        <h3 className="modal-title">{existingData ? 'Edit Matkul' : 'Tambah Matkul'}</h3>

        <div className="form-row">
          <label>Nama Mata Kuliah:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="form-row">
          <label>Kode:</label>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>

        <div className="form-row">
          <label>SKS:</label>
          <input type="number" min="1" value={sks} onChange={(e) => setSks(e.target.value)} />
        </div>

        <div className="form-row">
          <label>Prodi:</label>
          <select value={prodiId} onChange={(e) => setProdiId(e.target.value)}>
            <option value="">-- Pilih Prodi --</option>
            {prodiList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-actions">
          <button className="btn-submit" onClick={handleSubmit}>
            {existingData ? 'Update' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
