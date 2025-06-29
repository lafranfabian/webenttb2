import React, { useEffect, useState } from 'react';
import '../styles/TambahDosenModal.css';
import supabase from '../utils/supabase';

export default function TambahMatkulModal({ onClose, onSuccess, existingData }) {
  const [name, setName] = useState(existingData?.name || '');
  const [code, setCode] = useState(existingData?.code || '');
  const [sks, setSks] = useState(existingData?.sks?.toString() || '');
  const [prodiId, setProdiId] = useState(existingData?.prodi_id?.toString() || '');
  const [prodiList, setProdiList] = useState([]);

  useEffect(() => {
    const fetchProdi = async () => {
      const { data, error } = await supabase.from('prodi').select();
      if (error) {
        console.error('Gagal mengambil prodi:', error.message);
        return;
      }

      const sudahAdaUmum = data.some(p => p.id === 0);
      const list = sudahAdaUmum ? data : [{ id: 0, nama: 'Mata Kuliah Umum', kode: 'UMUM' }, ...data];
      setProdiList(list);
    };
    fetchProdi();
  }, []);

  const handleSubmit = async () => {
    if (!name || !code || !sks || !prodiId) {
      alert('Semua field wajib diisi.');
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      sks: parseInt(sks),
      prodi_id: parseInt(prodiId),
    };

    // Validasi duplikat kode matkul
    const { data: existing, error: checkError } = await supabase
      .from('modules')
      .select('id')
      .eq('code', payload.code);

    if (checkError) {
      console.error('Gagal cek kode:', checkError.message);
      alert('Terjadi kesalahan saat memeriksa kode.');
      return;
    }

    const isDuplikat = existing.length > 0 && (!existingData || existing[0].id !== existingData.id);
    if (isDuplikat) {
      alert('Kode mata kuliah sudah digunakan.');
      return;
    }

    let error;
    if (existingData) {
      ({ error } = await supabase.from('modules').update(payload).eq('id', existingData.id));
    } else {
      ({ error } = await supabase.from('modules').insert(payload));
    }

    if (error) {
      console.error('Gagal menyimpan:', error.message);
      alert('Gagal menyimpan mata kuliah.');
    } else {
      alert(existingData ? 'Mata kuliah berhasil diperbarui' : 'Mata kuliah berhasil ditambahkan');
      onSuccess();
      onClose();
    }
  };

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
