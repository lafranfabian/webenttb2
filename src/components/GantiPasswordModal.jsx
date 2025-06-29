// components/GantiPasswordModal.jsx
import React from 'react';
import '../styles/GantiPasswordModal.css';

export default function GantiPasswordModal({ onClose, onSave, newPassword, setNewPassword }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Ganti Password</h3>
        <p>Password Anda masih default (NIP). Silakan buat password baru.</p>
        <input
          type="password"
          placeholder="Password baru"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <div className="modal-actions">
          <button onClick={onSave}>Simpan</button>
          <button onClick={onClose} className="cancel-btn">Batal</button>
        </div>
      </div>
    </div>
  );
}
