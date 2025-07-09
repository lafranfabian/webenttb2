// Import library dan komponen yang dibutuhkan
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';
import LogoUMB from '../assets/logo.png';
import TambahDosenModal from '../components/TambahDosenModal';
import TambahMatkulModal from '../components/TambahMatkul';
import TambahJadwalModal from '../components/TambahJadwalModal';
import TambahMahasiswaModal from '../components/TambahMahasiswaModal';
import supabase from '../utils/supabase';

export default function AdminDashboard() {
  // State untuk menu aktif (dosen/mahasiswa/matkul/jadwal)
  const [activeMenu, setActiveMenu] = useState('dosen');

  // State untuk kontrol modal tampil/tidak
  const [showModal, setShowModal] = useState(false);
  const [showMatkulModal, setShowMatkulModal] = useState(false);
  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [showMahasiswaModal, setShowMahasiswaModal] = useState(false);

  // State untuk data yang sedang diedit
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [selectedMatkul, setSelectedMatkul] = useState(null);
  const [selectedJadwal, setSelectedJadwal] = useState(null);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState(null);

  // State untuk menyimpan list data
  const [dosenList, setDosenList] = useState([]);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [matkulList, setMatkulList] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);
  const [prodiList, setProdiList] = useState([]);

  // State pencarian
  const [searchMatkul, setSearchMatkul] = useState('');
  const [searchDosen, setSearchDosen] = useState('');
  const [searchMahasiswa, setSearchMahasiswa] = useState('');

  const navigate = useNavigate();

  // Fungsi ambil data dosen dari Supabase
  const fetchDosen = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, nip, email, role, prodi_id')
      .eq('role', 'dosen');
    if (data) setDosenList(data);
  };

  // Fungsi ambil data mahasiswa
  const fetchMahasiswa = async () => {
    const { data } = await supabase.from('mahasiswa').select('id, nama, nim, email, prodi_id');
    if (data) setMahasiswaList(data);
  };

  // Fungsi ambil data mata kuliah
  const fetchMatkul = async () => {
    const { data } = await supabase.from('modules').select();
    if (data) setMatkulList(data);
  };

  // Fungsi ambil data jadwal kuliah
  const fetchJadwal = async () => {
    const { data } = await supabase
      .from('jadwal')
      .select(`
        id,
        hari,
        jam_mulai,
        jam_selesai,
        ruangan_kode(kode),
        matkul_id(id, name),
        dosen_id(id, full_name)
      `);
    if (data) setJadwalList(data);
  };

  // Fungsi ambil daftar prodi
  const fetchProdi = async () => {
    const { data } = await supabase.from('prodi').select();
    if (data) setProdiList(data);
  };

  // Ambil semua data saat pertama kali halaman dimuat
  useEffect(() => {
    fetchDosen();
    fetchMahasiswa();
    fetchMatkul();
    fetchJadwal();
    fetchProdi();
  }, []);

  // Fungsi logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Fungsi untuk buka modal tambah dosen
  const handleAddDosen = () => {
    setSelectedDosen(null);
    setShowModal(true);
  };

  // Fungsi untuk buka modal tambah mahasiswa
  const handleAddMahasiswa = () => {
    setSelectedMahasiswa(null);
    setShowMahasiswaModal(true);
  };

  // Fungsi untuk buka modal tambah mata kuliah
  const handleAddMatkul = () => {
    setSelectedMatkul(null);
    setShowMatkulModal(true);
  };

  // Fungsi untuk buka modal tambah jadwal
  const handleAddJadwal = () => {
    setSelectedJadwal(null);
    setShowJadwalModal(true);
  };

  // Fungsi hapus dosen
  const handleDeleteDosen = async (id) => {
    if (confirm('Yakin ingin menghapus dosen ini?')) {
      await supabase.from('jadwal').delete().eq('dosen_id', id); // Hapus jadwal dosen
      const { error } = await supabase.from('profiles').delete().eq('id', id); // Hapus dosennya
      if (!error) {
        fetchDosen();
        fetchJadwal();
      } else {
        alert('Gagal menghapus dosen');
      }
    }
  };

  // Fungsi hapus mahasiswa
  const handleDeleteMahasiswa = async (id) => {
    if (confirm('Yakin ingin menghapus mahasiswa ini?')) {
      const { error } = await supabase.from('mahasiswa').delete().eq('id', id);
      if (!error) {
        fetchMahasiswa();
      } else {
        alert('Gagal menghapus mahasiswa');
      }
    }
  };

  // Fungsi hapus matkul
  const handleDeleteMatkul = async (id) => {
    if (confirm('Yakin ingin menghapus matkul ini?')) {
      await supabase.from('modules').delete().eq('id', id);
      fetchMatkul();
    }
  };

  // Fungsi hapus jadwal
  const handleDeleteJadwal = async (id) => {
    if (confirm('Yakin ingin menghapus jadwal ini?')) {
      await supabase.from('jadwal').delete().eq('id', id);
      fetchJadwal();
    }
  };

  // Fungsi edit dosen
  const handleEditDosen = (d) => {
    setSelectedDosen(d);
    setShowModal(true);
  };

  // Fungsi edit mahasiswa
  const handleEditMahasiswa = (m) => {
    setSelectedMahasiswa(m);
    setShowMahasiswaModal(true);
  };

  // Fungsi edit mata kuliah
  const handleEditMatkul = (m) => {
    setSelectedMatkul(m);
    setShowMatkulModal(true);
  };

  // Fungsi edit jadwal
  const handleEditJadwal = (j) => {
    setSelectedJadwal({
      id: j.id,
      hari: j.hari,
      jam_mulai: j.jam_mulai,
      jam_selesai: j.jam_selesai,
      ruangan_kode: j.ruangan_kode?.kode,
      matkul_id: j.matkul_id?.id,
      dosen_id: j.dosen_id?.id,
    });
    setShowJadwalModal(true);
  };

  // Filter berdasarkan pencarian
  const filteredMatkul = matkulList.filter(
    (m) =>
      m.name.toLowerCase().includes(searchMatkul.toLowerCase()) ||
      m.code.toLowerCase().includes(searchMatkul.toLowerCase())
  );

  const filteredDosen = dosenList.filter((d) =>
    d.full_name.toLowerCase().includes(searchDosen.toLowerCase())
  );

  const filteredMahasiswa = mahasiswaList.filter((m) =>
    (m.nama || '').toLowerCase().includes(searchMahasiswa.toLowerCase()) ||
    (m.nim || '').toLowerCase().includes(searchMahasiswa.toLowerCase())
  );

  // --- RENDERING UTAMA --- //
  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <img src={LogoUMB} alt="Logo UMB" className="sidebar-logo" />
        <ul className="menu-list">
          <li className={activeMenu === 'dosen' ? 'active' : ''} onClick={() => setActiveMenu('dosen')}>Dosen</li>
          <li className={activeMenu === 'mahasiswa' ? 'active' : ''} onClick={() => setActiveMenu('mahasiswa')}>Mahasiswa</li>
          <li className={activeMenu === 'matkul' ? 'active' : ''} onClick={() => setActiveMenu('matkul')}>Mata Kuliah</li>
          <li className={activeMenu === 'jadwal' ? 'active' : ''} onClick={() => setActiveMenu('jadwal')}>Jadwal</li>
        </ul>
      </aside>

      {/* Main content */}
      <main className="admin-content">
        <header className="admin-header">
          <h2>Module Dosen UMB Jakarta</h2>
          <div className="admin-user">
            <span>Admin</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {/* Render konten sesuai menu yang aktif */}
        {activeMenu === 'mahasiswa' && (
          // Komponen manajemen mahasiswa
          <section className="admin-section">
            <h3>Manajemen Mahasiswa</h3>
            <div className="mahasiswa-controls">
              <input type="text" placeholder="🔍 Cari nama/NIM" value={searchMahasiswa} onChange={(e) => setSearchMahasiswa(e.target.value)} />
              <button className="add-button" onClick={handleAddMahasiswa}>Tambah Mahasiswa</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No</th><th>Nama</th><th>NIM</th><th>Email</th><th>Prodi</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMahasiswa.map((m, i) => (
                  <tr key={m.id}>
                    <td>{i + 1}</td>
                    <td>{m.nama}</td>
                    <td>{m.nim}</td>
                    <td>{m.email}</td>
                    <td>{prodiList.find(p => p.id === m.prodi_id)?.nama || '-'}</td>
                    <td>
                      <button onClick={() => handleEditMahasiswa(m)}>✎</button>
                      <button onClick={() => handleDeleteMahasiswa(m.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeMenu === 'dosen' && (
          // Komponen manajemen dosen
          <section className="admin-section">
            <h3>Manajemen Dosen</h3>
            <div className="dosen-controls">
              <input type="text" placeholder="🔍 Cari nama dosen" value={searchDosen} onChange={(e) => setSearchDosen(e.target.value)} />
              <button className="add-button" onClick={handleAddDosen}>Tambah Dosen</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No</th><th>Nama</th><th>NIP</th><th>Email</th><th>Prodi</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredDosen.map((d, i) => (
                  <tr key={d.id}>
                    <td>{i + 1}</td>
                    <td>{d.full_name}</td>
                    <td>{d.nip}</td>
                    <td>{d.email}</td>
                    <td>{prodiList.find(p => p.id === d.prodi_id)?.nama || '-'}</td>
                    <td>
                      <button onClick={() => handleEditDosen(d)}>✎</button>
                      <button onClick={() => handleDeleteDosen(d.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeMenu === 'matkul' && (
          // Komponen manajemen mata kuliah
          <section className="admin-section">
            <h3>Manajemen Mata Kuliah</h3>
            <div className="matkul-controls">
              <input type="text" placeholder="🔍 Cari nama/kode matkul" value={searchMatkul} onChange={(e) => setSearchMatkul(e.target.value)} />
              <button className="add-button" onClick={handleAddMatkul}>Tambah Matkul</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No</th><th>Nama</th><th>Kode</th><th>SKS</th><th>Prodi</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatkul.map((m, i) => (
                  <tr key={m.id}>
                    <td>{i + 1}</td>
                    <td>{m.name}</td>
                    <td>{m.code}</td>
                    <td>{m.sks}</td>
                    <td>{prodiList.find(p => p.id === m.prodi_id)?.nama || (m.prodi_id === 0 ? 'Mata Kuliah Umum' : '-')}</td>
                    <td>
                      <button onClick={() => handleEditMatkul(m)}>✎</button>
                      <button onClick={() => handleDeleteMatkul(m.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeMenu === 'jadwal' && (
          // Komponen manajemen jadwal
          <section className="admin-section">
            <h3>Jadwal Mata Kuliah</h3>
            <button className="add-button" onClick={handleAddJadwal}>Tambah Jadwal</button>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ruangan</th><th>Hari</th><th>Jam</th><th>Mata Kuliah</th><th>Dosen</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {jadwalList.map((j) => (
                  <tr key={j.id}>
                    <td>{j.ruangan_kode?.kode}</td>
                    <td>{j.hari}</td>
                    <td>{j.jam_mulai} - {j.jam_selesai}</td>
                    <td>{j.matkul_id?.name}</td>
                    <td>{j.dosen_id?.full_name}</td>
                    <td>
                      <button onClick={() => handleEditJadwal(j)}>✎</button>
                      <button onClick={() => handleDeleteJadwal(j.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <TambahDosenModal
          onClose={() => {
            setShowModal(false);
            fetchDosen();
          }}
          existingData={selectedDosen}
        />
      )}
      {showMatkulModal && (
        <TambahMatkulModal
          onClose={() => setShowMatkulModal(false)}
          onSuccess={() => {
            fetchMatkul();
            setShowMatkulModal(false);
          }}
          existingData={selectedMatkul}
        />
      )}
      {showJadwalModal && (
        <TambahJadwalModal
          onClose={() => setShowJadwalModal(false)}
          onSuccess={() => {
            fetchJadwal();
            setShowJadwalModal(false);
          }}
          existingData={selectedJadwal}
        />
      )}
      {showMahasiswaModal && (
        <TambahMahasiswaModal
          onClose={() => {
            setShowMahasiswaModal(false);
            fetchMahasiswa();
          }}
          existingData={selectedMahasiswa}
          prodiList={prodiList}
        />
      )}
    </div>
  );
}
