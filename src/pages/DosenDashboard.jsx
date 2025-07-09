import React, { useEffect, useState } from 'react';
import '../styles/AdminDashboard.css';
import LogoUMB from '../assets/LOGO.png';
import supabase from '../utils/supabase';
import GantiPasswordModal from '../components/GantiPasswordModal';

// Komponen utama Dashboard Dosen
export default function DosenDashboard({ user, onLogout }) {
  // State untuk navigasi, data profil, jadwal, dan modal
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [jadwal, setJadwal] = useState([]);
  const [matkulUnik, setMatkulUnik] = useState([]);
  const [nextJadwal, setNextJadwal] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ email: '', nip: '' });

  // Konstanta hari dan waktu sekarang
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const now = new Date();

  // Fungsi bantu: Mengubah jam dan hari menjadi objek Date
  function parseJam(jam, hari) {
    const [jamStr, menitStr] = jam.split(':');
    const target = new Date();
    const dayIndex = days.indexOf(hari);
    const diff = (dayIndex - now.getDay() + 7) % 7;
    target.setDate(now.getDate() + diff);
    target.setHours(+jamStr, +menitStr, 0, 0);
    return target;
  }

  // Ambil data profil, jadwal, matkul ketika komponen dimount
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      // Ambil data prodi dan profil dosen
      const { data: prodi } = await supabase.from('prodi').select('*');
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Gabungkan data prodi ke dalam data profil
      const prodiNama = prodi?.find(p => p.id === prof?.prodi_id)?.nama || '-';
      setProfile({ ...prof, prodi_nama: prodiNama });

      // Set state untuk form edit
      setEditedProfile({ email: prof.email, nip: prof.nip });

      // Tampilkan modal ganti password jika masih default
      if (prof?.default_password === true) {
        setShowPasswordModal(true);
      }

      // Ambil data jadwal dan matkul
      const { data: jadwalData } = await supabase
        .from('jadwal')
        .select('*')
        .eq('dosen_id', user.id);

      const { data: allMatkul } = await supabase.from('modules').select('id, name, code, sks');

      // Gabungkan info matkul ke dalam data jadwal
      const enriched = jadwalData.map(j => ({
        ...j,
        matkul: allMatkul.find(m => m.id === j.matkul_id),
      }));

      setJadwal(enriched);

      // Dapatkan daftar matkul unik
      const map = new Map();
      const unique = [];
      enriched.forEach(j => {
        if (j.matkul && !map.has(j.matkul.id)) {
          map.set(j.matkul.id, true);
          unique.push(j.matkul);
        }
      });
      setMatkulUnik(unique);

      // Cari jadwal terdekat yang belum lewat
      const upcoming = enriched
        .filter(j => parseJam(j.jam_mulai, j.hari) > now)
        .sort((a, b) => parseJam(a.jam_mulai, a.hari) - parseJam(b.jam_mulai, b.hari));

      setNextJadwal(upcoming[0] || null);
    };

    fetchData();
  }, [user]);

  // Fungsi ubah password
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password harus minimal 6 karakter');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      alert('Gagal update password: ' + error.message);
    } else {
      await supabase.from('profiles').update({ default_password: false }).eq('id', user.id);
      setShowPasswordModal(false);
      alert('Password berhasil diubah!');
    }
  };

  // Fungsi simpan perubahan profil
  const handleSaveProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update(editedProfile)
      .eq('id', user.id);

    if (!error) {
      setProfile({ ...profile, ...editedProfile });
      setShowEditModal(false);
      alert('Profil berhasil diperbarui.');
    } else {
      alert('Gagal update profil: ' + error.message);
    }
  };

  return (
    <div className="admin-container">
      {/* Sidebar navigasi */}
      <aside className="admin-sidebar">
        <img src={LogoUMB} alt="Logo UMB" className="sidebar-logo" />
        <ul className="menu-list">
          <li className={activeMenu === 'dashboard' ? 'active' : ''} onClick={() => setActiveMenu('dashboard')}>Dashboard</li>
          <li className={activeMenu === 'profile' ? 'active' : ''} onClick={() => setActiveMenu('profile')}>Profile</li>
        </ul>
      </aside>

      {/* Konten utama */}
      <main className="admin-content">
        <header className="admin-header">
          <h2>Module Dosen UMB Jakarta</h2>
          <div className="admin-user">
            <span>{profile?.full_name}</span>
            <button onClick={onLogout}>Logout</button>
          </div>
        </header>

        {/* Menu Dashboard */}
        {activeMenu === 'dashboard' && (
          <>
            <section className="admin-section">
              <div className="dashboard-cards">
                <div className="card">
                  <img src="/Open_Book.png" alt="book" />
                  <p>Total Mata Kuliah Saya</p>
                  <h3>{matkulUnik.length}</h3>
                </div>
                <div className="card">
                  <img src="/Calendar.png" alt="calendar" />
                  <p>Jadwal Saat Ini</p>
                  <h3>{jadwal.length}</h3>
                </div>
              </div>
            </section>

            {/* Jadwal terdekat */}
            {nextJadwal && (
              <section className="admin-section">
                <h3>Jadwal Selanjutnya</h3>
                <div className="dashboard-cards">
                  <div className="card next-jadwal-card">
                    <p><strong>{nextJadwal.matkul?.name}</strong></p>
                    <p><strong>Hari:</strong> {nextJadwal.hari}</p>
                    <p><strong>Jam:</strong> {nextJadwal.jam_mulai} - {nextJadwal.jam_selesai}</p>
                    <p><strong>Ruangan:</strong> {nextJadwal.ruangan_kode}</p>
                    <p><strong>Mulai Dalam:</strong> {
                      (() => {
                        const target = parseJam(nextJadwal.jam_mulai, nextJadwal.hari);
                        const diffMs = target - new Date();
                        const diffMin = Math.floor(diffMs / 60000);
                        const jam = Math.floor(diffMin / 60);
                        const menit = diffMin % 60;
                        return jam > 0 ? `${jam} jam ${menit} menit` : `${menit} menit`;
                      })()
                    }</p>
                  </div>
                </div>
              </section>
            )}

            {/* Tabel Jadwal */}
            <section className="admin-section">
              <h3>Jadwal Saya</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Hari</th>
                    <th>Jam</th>
                    <th>Mata Kuliah</th>
                    <th>Ruangan</th>
                  </tr>
                </thead>
                <tbody>
                  {jadwal.map(j => (
                    <tr key={j.id}>
                      <td>{j.hari}</td>
                      <td>{j.jam_mulai} - {j.jam_selesai}</td>
                      <td>{j.matkul?.name}</td>
                      <td>{j.ruangan_kode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Tabel Mata Kuliah */}
            <section className="admin-section">
              <h3>Mata Kuliah Saya</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama</th>
                    <th>Kode</th>
                    <th>SKS</th>
                  </tr>
                </thead>
                <tbody>
                  {matkulUnik.map((m, i) => (
                    <tr key={m.id}>
                      <td>{i + 1}</td>
                      <td>{m.name}</td>
                      <td>{m.code}</td>
                      <td>{m.sks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}

        {/* Menu Profile */}
        {activeMenu === 'profile' && profile && (
          <section className="admin-section">
            <h3>Profil Saya</h3>
            <div className="dashboard-cards">
              <div className="card profile-card">
                <table>
                  <tbody>
                    <tr><td>Nama Lengkap</td><td>{profile.full_name}</td></tr>
                    <tr><td>Email</td><td>{profile.email}</td></tr>
                    <tr><td>NIP</td><td>{profile.nip}</td></tr>
                    <tr><td>Program Studi</td><td>{profile.prodi_nama}</td></tr>
                  </tbody>
                </table>
                <button onClick={() => setShowEditModal(true)}>Edit Profile</button>
              </div>
            </div>
          </section>
        )}

        {/* Modal Edit Profile */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Edit Profil</h3>
              <input
                type="email"
                placeholder="Email"
                value={editedProfile.email}
                onChange={e => setEditedProfile({ ...editedProfile, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="NIP"
                value={editedProfile.nip}
                onChange={e => setEditedProfile({ ...editedProfile, nip: e.target.value })}
              />
              <div style={{ marginTop: 16 }}>
                <button onClick={handleSaveProfile}>Simpan</button>
                <button style={{ marginLeft: 12, background: '#ccc', color: '#333' }} onClick={() => setShowEditModal(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ganti Password */}
        {showPasswordModal && (
          <GantiPasswordModal
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            onSave={handleChangePassword}
            onClose={() => setShowPasswordModal(false)}
          />
        )}
      </main>
    </div>
  );
}
