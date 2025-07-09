import React, { useState, useEffect } from 'react';
import supabase from '../utils/supabase';
import '../styles/TambahDosenModal.css'; // Gunakan CSS yang sama agar seragam

export default function TambahMahasiswaModal({ onClose, existingData }) {
  const [form, setForm] = useState({
    nama: '',
    nim: '',
    email: '',
    prodi_id: '',
  });

  const [prodiList, setProdiList] = useState([]);

  useEffect(() => {
    if (existingData) {
      setForm({
        nama: existingData.nama || '',
        nim: existingData.nim || '',
        email: existingData.email || '',
        prodi_id: existingData.prodi_id || '',
      });
    }
  }, [existingData]);

  useEffect(() => {
    const fetchProdi = async () => {
      const { data, error } = await supabase.from('prodi').select();
      if (!error) {
        setProdiList(data);
      } else {
        alert('Gagal mengambil data prodi');
      }
    };
    fetchProdi();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.nama || !form.nim || !form.email || !form.prodi_id) {
      alert('Semua kolom harus diisi!');
      return;
    }

    const { error } = existingData
      ? await supabase.from('mahasiswa').update(form).eq('id', existingData.id)
      : await supabase.from('mahasiswa').insert([{ ...form }]);

    if (error) {
      alert('Gagal menyimpan data');
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>{existingData ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}</h3>
        <input
          name="nama"
          value={form.nama}
          onChange={handleChange}
          placeholder="Nama Lengkap"
        />
        <input
          name="nim"
          value={form.nim}
          onChange={handleChange}
          placeholder="NIM"
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
        />
        <select name="prodi_id" value={form.prodi_id} onChange={handleChange}>
          <option value="">Pilih Prodi</option>
          {prodiList.map((prodi) => (
            <option key={prodi.id} value={prodi.id}>
              {prodi.nama}
            </option>
          ))}
        </select>

        <div className="modal-actions">
          <button onClick={handleSubmit}>
            {existingData ? 'Simpan' : 'Tambah'}
          </button>
          <button onClick={onClose} className="cancel-button">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
