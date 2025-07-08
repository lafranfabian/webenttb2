import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';
import LogoUMB from '../assets/logo.png';
import TambahDosenModal from '../components/TambahDosenModal';
import TambahMatkulModal from '../components/TambahMatkul';
import TambahJadwalModal from '../components/TambahJadwalModal';
import supabase from '../utils/supabase';

export default function AdminDashboard() {
  // State untuk menu aktif: dosen / matkul / jadwal
  const [activeMenu, setActiveMenu] = useState('dosen');

  // State kontrol untuk modal tambah/edit
  const [showModal, setShowModal] = useState(false);
  const [showMatkulModal, setShowMatkulModal] = useState(false);
  const [showJadwalModal, setShowJadwalModal] = useState(false);

  // State data yang sedang dipilih untuk diedit
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [selectedMatkul, setSelectedMatkul] = useState(null);
  const [selectedJadwal, setSelectedJadwal] = useState(null);

  // Data list dari database
  const [dosenList, setDosenList] = useState([]);
  const [matkulList, setMatkulList] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);

  // State pencarian
  const [searchMatkul, setSearchMatkul] = useState('');
  const [searchDosen, setSearchDosen] = useState('');

  const navigate = useNavigate();

  // Ambil data dosen dari Supabase
  const fetchDosen = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, nip, email, role, prodi_id')
      .eq('role', 'dosen');
    if (data) setDosenList(data);
  };

  // Ambil data mata kuliah dari Supabase
  const fetchMatkul = async () => {
    const { data } = await supabase.from('modules').select();
    if (data) setMatkulList(data);
  };

  // Ambil data jadwal dari Supabase
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

  // Ambil semua data saat pertama kali render
  useEffect(() => {
    fetchDosen();
    fetchMatkul();
    fetchJadwal();
  }, []);

  // Logout dan kembali ke login
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Fungsi tombol tambah dosen
  const handleAddDosen = () => {
    setSelectedDosen(null); // kosong berarti tambah baru
    setShowModal(true);
  };

  // Fungsi tombol edit dosen
  const handleEditDosen = (dosen) => {
    setSelectedDosen(dosen);
    setShowModal(true);
  };

  // Hapus dosen dan semua jadwal terkait
  const handleDeleteDosen = async (id) => {
    if (confirm('Yakin ingin menghapus dosen ini?')) {
      await supabase.from('jadwal').delete().eq('dosen_id', id); // hapus jadwal
      const { error } = await supabase.from('profiles').delete().eq('id', id); // hapus dosen
      if (!error) {
        fetchDosen(); // refresh data
        fetchJadwal();
      } else {
        alert('Gagal menghapus dosen');
      }
    }
  };

  // Tambah matkul baru
  const handleAddMatkul = () => {
    setSelectedMatkul(null);
    setShowMatkulModal(true);
  };

  // Edit matkul yang ada
  const handleEditMatkul = (matkul) => {
    setSelectedMatkul(matkul);
    setShowMatkulModal(true);
  };

  // Hapus mata kuliah
  const handleDeleteMatkul = async (id) => {
    if (confirm('Yakin ingin menghapus matkul ini?')) {
      await supabase.from('modules').delete().eq('id', id);
      fetchMatkul();
    }
  };

  // Tambah jadwal baru
  const handleAddJadwal = () => {
    setSelectedJadwal(null);
    setShowJadwalModal(true);
  };

  // Edit jadwal yang ada
  const handleEditJadwal = (jadwal) => {
    setSelectedJadwal({
      id: jadwal.id,
      hari: jadwal.hari,
      jam_mulai: jadwal.jam_mulai,
      jam_selesai: jadwal.jam_selesai,
      ruangan_kode: jadwal.ruangan_kode?.kode,
      matkul_id: jadwal.matkul_id?.id,
      dosen_id: jadwal.dosen_id?.id,
    });
    setShowJadwalModal(true);
  };

  // Hapus jadwal
  const handleDeleteJadwal = async (id) => {
    if (confirm('Yakin ingin menghapus jadwal ini?')) {
      await supabase.from('jadwal').delete().eq('id', id);
      fetchJadwal();
    }
  };

  // Filter pencarian matkul
  const filteredMatkul = matkulList.filter(
    (m) =>
      m.name.toLowerCase().includes(searchMatkul.toLowerCase()) ||
      m.code.toLowerCase().includes(searchMatkul.toLowerCase())
  );

  // Filter pencarian dosen
  const filteredDosen = dosenList.filter((d) =>
    d.full_name.toLowerCase().includes(searchDosen.toLowerCase())
  );

  return (
    <div className="admin-container">
      {/* Sidebar Navigasi */}
      <aside className="admin-sidebar">
        <img src={LogoUMB} alt="Logo UMB" className="sidebar-logo" />
        <ul className="menu-list">
          <li className={activeMenu === 'dosen' ? 'active' : ''} onClick={() => setActiveMenu('dosen')}>Dosen</li>
          <li className={activeMenu === 'matkul' ? 'active' : ''} onClick={() => setActiveMenu('matkul')}>Mata Kuliah</li>
          <li className={activeMenu === 'jadwal' ? 'active' : ''} onClick={() => setActiveMenu('jadwal')}>Jadwal</li>
        </ul>
      </aside>

      <main className="admin-content">
        {/* Header */}
        <header className="admin-header">
          <h2>Module Dosen UMB Jakarta</h2>
          <div className="admin-user">
            <span>Admin</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {/* Halaman Manajemen Dosen */}
        {activeMenu === 'dosen' && (
          <section className="admin-section">
            <h3>Manajemen Dosen</h3>
            <div className="dosen-controls">
              <input
                type="text"
                placeholder="🔍 Cari nama dosen"
                value={searchDosen}
                onChange={(e) => setSearchDosen(e.target.value)}
              />
              <button className="add-button" onClick={handleAddDosen}>Tambah Dosen</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>NIP</th>
                  <th>Email</th>
                  <th>Prodi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredDosen.map((d, i) => (
                  <tr key={d.id}>
                    <td>{i + 1}</td>
                    <td>{d.full_name}</td>
                    <td>{d.nip}</td>
                    <td>{d.email}</td>
                    <td>{d.prodi_id}</td>
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

        {/* Halaman Manajemen Mata Kuliah */}
        {activeMenu === 'matkul' && (
          <section className="admin-section">
            <h3>Manajemen Mata Kuliah</h3>
            <div className="matkul-controls">
              <input
                type="text"
                placeholder="🔍 Cari nama/kode matkul"
                value={searchMatkul}
                onChange={(e) => setSearchMatkul(e.target.value)}
              />
              <button className="add-button" onClick={handleAddMatkul}>Tambah Matkul</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Kode</th>
                  <th>SKS</th>
                  <th>Prodi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatkul.map((m, i) => (
                  <tr key={m.id}>
                    <td>{i + 1}</td>
                    <td>{m.name}</td>
                    <td>{m.code}</td>
                    <td>{m.sks}</td>
                    <td>{m.prodi_id === 0 ? 'Mata Kuliah Umum' : m.prodi_id}</td>
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

        {/* Halaman Jadwal */}
        {activeMenu === 'jadwal' && (
          <section className="admin-section">
            <h3>Jadwal Mata Kuliah</h3>
            <button className="add-button" onClick={handleAddJadwal}>Tambah Jadwal</button>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ruangan</th>
                  <th>Hari</th>
                  <th>Jam</th>
                  <th>Mata Kuliah</th>
                  <th>Dosen</th>
                  <th>Aksi</th>
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

      {/* MODAL TAMBAH/EDIT */}
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
    </div>
  );
}
