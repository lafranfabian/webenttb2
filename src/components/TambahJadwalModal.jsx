import React, { useEffect, useState } from 'react';
import supabase from '../utils/supabase';
import '../styles/TambahDosenModal.css'; // atau buat file baru khusus jadwal jika ingin lebih rapi

export default function TambahJadwalModal({ onClose, onSuccess, existingData }) {
  const [ruangList, setRuangList] = useState([]);
  const [matkulList, setMatkulList] = useState([]);
  const [dosenList, setDosenList] = useState([]);

  const [hari, setHari] = useState(existingData?.hari || '');
  const [jamMulai, setJamMulai] = useState(existingData?.jam_mulai || '');
  const [ruangan, setRuangan] = useState(existingData?.ruangan_kode || '');
  const [matkulId, setMatkulId] = useState(existingData?.matkul_id || '');
  const [dosenId, setDosenId] = useState(existingData?.dosen_id || '');

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

  const generateTimeOptions = () => {
    const options = [];
    let hour = 7;
    let minute = 30;
    while (hour < 20 || (hour === 20 && minute === 0)) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      options.push(`${h}:${m}`);
      minute += 30;
      if (minute === 60) {
        minute = 0;
        hour++;
      }
    }
    return options;
  };

  const hitungJamSelesai = (mulai) => {
    if (!mulai) return '';
    const [jam, menit] = mulai.split(':').map(Number);
    const totalMenit = jam * 60 + menit + 150;
    const jamSelesai = Math.floor(totalMenit / 60);
    const menitSelesai = totalMenit % 60;
    return `${jamSelesai.toString().padStart(2, '0')}:${menitSelesai.toString().padStart(2, '0')}`;
  };

  const jamSelesai = hitungJamSelesai(jamMulai);

  const handleSubmit = async () => {
    if (!hari || !jamMulai || !ruangan || !matkulId || !dosenId) {
      alert('Semua field wajib diisi');
      return;
    }

    const payload = {
      hari,
      jam_mulai: jamMulai,
      jam_selesai: jamSelesai,
      ruangan_kode: ruangan,
      matkul_id: matkulId,
      dosen_id: dosenId,
    };

    const { error } = existingData
      ? await supabase.from('jadwal').update(payload).eq('id', existingData.id)
      : await supabase.from('jadwal').insert(payload);

    if (error) {
      alert('Gagal menyimpan data.');
      console.error(error);
    } else {
      alert('Jadwal berhasil disimpan.');
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="btn-close" onClick={onClose}>×</button>
        <h3 className="modal-title">{existingData ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>

        <div className="form-group">
          <label>Hari:</label>
          <select value={hari} onChange={(e) => setHari(e.target.value)}>
            <option value="">Pilih Hari</option>
            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

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

        <div className="form-group">
          <label>Ruangan:</label>
          <select value={ruangan} onChange={(e) => setRuangan(e.target.value)}>
            <option value="">Pilih Ruangan</option>
            {ruangList.map((r) => (
              <option key={r.kode} value={r.kode}>{r.kode}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Mata Kuliah:</label>
          <select value={matkulId} onChange={(e) => setMatkulId(e.target.value)}>
            <option value="">Pilih Matkul</option>
            {matkulList.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Dosen Pengampu:</label>
          <select value={dosenId} onChange={(e) => setDosenId(e.target.value)}>
            <option value="">Pilih Dosen</option>
            {dosenList.map((d) => (
              <option key={d.id} value={d.id}>{d.full_name}</option>
            ))}
          </select>
        </div>

        <div className="modal-actions">
          <button className="btn-submit" style={{ backgroundColor: 'green' }} onClick={handleSubmit}>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
