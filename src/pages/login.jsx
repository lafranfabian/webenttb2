import React, { useState } from 'react';
import supabase from '../utils/supabase';
import '../styles/Login.css';
import LogoUMB from '../assets/logo.png';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Email dan Password tidak boleh kosong.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('Login gagal. Periksa email dan password Anda.');
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    // Ambil data user dari tabel profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', userId)
      .single();

    setLoading(false);

    if (profileError || !profile) {
      setErrorMsg('Gagal mengambil data user.');
      return;
    }

    // Kirim seluruh info user ke App.jsx
    onLoginSuccess(profile);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={LogoUMB} alt="Logo Universitas Mercu Buana" className="login-logo" />

        <h3 className="login-title">Login Manajemen Dosen Universitas Mercu Buana</h3>

        <input
          type="email"
          placeholder="Email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMsg && <p className="login-error">{errorMsg}</p>}

        <button className="login-button" onClick={handleLogin} disabled={loading}>
          {loading ? 'Memproses...' : 'Login'}
        </button>

        <p className="login-register">
          Belum Punya Akun?{' '}
          <a href="#" className="login-link">Daftar Disini</a>
        </p>
      </div>
    </div>
  );
}
