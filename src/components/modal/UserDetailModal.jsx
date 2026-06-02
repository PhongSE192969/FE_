
import { formatDate } from '@/utils/helpers'
import { Calendar, CheckCircle2, Clock, Key, KeyIcon, Mail, Phone, Shield, Store, User, X, XCircle } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { SelectOption } from '../ui';
import InputField from '../form/InputField';
import ConfirmModal from './ConfirmModal';

const UserDetailModal = ({
  selectedUser,
  setSelectedUser,
  getRoleBadge,
  rolesList = [],
  franchisesList = [],
  onSaveProfile,
  onUpdateStatus,
}) => {

  console.log("selectedUser", selectedUser)
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);


  const [formData, setFormData] = useState({
    fullName: '',
    roleId: '',
    franchiseId: '',
    status: ''
  });

  // Khởi tạo data khi vào chế độ edit
  useEffect(() => {
    if (isEditing && selectedUser) {
      setFormData({
        fullName: selectedUser?.fullName || '',
        roleId: selectedUser?.role?.id || '',
        franchiseId: selectedUser?.franchise?.id || '',
        status: selectedUser?.status || 'ACTIVE'
      });
    }
  }, [isEditing, selectedUser]);

  if (!selectedUser) return null;

  // Logic lấy option cho status dựa trên status hiện tại
  const getStatusOptions = (currentStatus) => {
    if (currentStatus === 'ACTIVE') {
      return [
        { value: 'ACTIVE', label: 'Active (Hoạt động)' },
        { value: 'SUSPENDED', label: 'Suspend (Khoá)' },
        { value: 'INACTIVE', label: 'Inactive (Xoá)' }
      ];
    }
    if (currentStatus === 'SUSPENDED') {
      return [
        { value: 'SUSPENDED', label: 'Suspended (Đang khoá)' },
        { value: 'ACTIVE', label: 'Unlock (Mở khoá)' },
        { value: 'INACTIVE', label: 'Inactive (Xoá)' }
      ];
    }
    return [{ value: currentStatus, label: currentStatus }];
  };

  const handleTriggerSave = () => {
    setShowConfirmUpdate(true);
  };

  const handleConfirmSave = () => {
    if (onSaveProfile) {

      const selectedRole = rolesList.find(r => r.id === formData.roleId);

      const payloadData = {
        fullName: formData.fullName,
        roleName: selectedRole ? selectedRole.name : '',
        status: formData.status,
        franchise: formData.franchiseId || null // API cần key là 'franchise'
      };

      onSaveProfile(selectedUser.id, payloadData);
    }
    setIsEditing(false);
    setShowConfirmUpdate(false);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold">ACTIVE</span>;
      case 'SUSPENDED':
        return <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-bold">SUSPENDED</span>;
      case 'DELETED':
        return <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">DELETED</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">{status}</span>;
    }
  };

  return (
    <div className="w-full h-full fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

        {/* Header Section */}
        <div className="relative h-32 bg-gradient-to-r from-[#0f172a] to-[#1e3a5f] shrink-0">
          <button
            onClick={() => setSelectedUser(null)}
            className="absolute top-4 right-4 size-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>

          <div className="absolute top-4 bottom- left-8 flex items-end gap-4">
            <div className="size-24 rounded-3xl bg-white p-1 shadow-xl">
              {selectedUser?.avatarUrl ? (
                <img
                  src={selectedUser.avatarUrl}
                  alt="Avatar"
                  className="size-full rounded-2xl object-cover bg-gray-100"
                />
              ) : (
                <div className="size-full rounded-2xl bg-[#d9a13b] flex items-center justify-center text-3xl font-black text-white">
                  {selectedUser?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="my-2">
              <div className="flex items-center gap-2">
                {/* Sửa đổi Tên FullName khi đang Edit Mode */}
                {!isEditing ? (
                  <h3 className="text-xl font-bold text-white leading-none">{selectedUser?.fullName}</h3>
                ) : (
                  <InputField label="" error={''}>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="text-sm font-bold bg-white py-1 px-1 rounded outline-none"
                      placeholder="Enter full name..."
                    />
                  </InputField>
                )}
                {renderStatusBadge(selectedUser?.status)}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-400 tracking-wider">@{selectedUser?.username}</span>
                {getRoleBadge(selectedUser?.role || selectedUser?.role)}
              </div>
              <div className="flex mt-2 items-center gap-3 text-sm text-slate-600 font-semibold">
                <div className="color-slate-400 flex items-center gap-1">
                  <KeyIcon size={10} color='yellow' /></div>
                <div className="flex-1 truncate">{selectedUser?.id}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Body Section */}
        <div className="pt-20 p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">

          {/* Cột trái: Thông tin cá nhân */}
          <div className="space-y-6">
            <div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Personal & Contact</h4>
              <div className="space-y-3">

                <div className="flex items-center gap-3 text-sm text-slate-600 font-semibold">
                  <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                    <Mail size={16} /></div>
                  <div className="flex-1 truncate">{selectedUser.email}</div>
                  {selectedUser?.verifyEmail ? (
                    <CheckCircle2 size={16} className="text-green-500" title="Email Verified" />
                  ) : (
                    <XCircle size={16} className="text-red-400" title="Email Unverified" />
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600 font-semibold">
                  <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                    <Phone size={16} /></div>
                  {selectedUser.phone || 'N/A'}
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600 font-semibold">
                  <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                    <User size={16} /></div>
                  {selectedUser.gender === true ? 'Male' : selectedUser.gender === false ? 'Female' : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Thông tin hệ thống và phân quyền */}
          <div className="space-y-6">
            <div>
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">System & Employment</h4>

              {!isEditing ? (
                /* CHẾ ĐỘ HIỂN THỊ (VIEW MODE) */
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Shield size={14} /> Assigned Role
                    </div>
                    <span className="text-xs font-bold text-slate-900">{selectedUser?.role?.name || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Store size={14} /> Franchise
                    </div>
                    <span className="text-xs font-bold text-slate-900">{selectedUser?.franchise?.name || 'None'}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Calendar size={14} /> Joined Date
                    </div>
                    <span className="text-xs text-slate-600">{selectedUser?.createdAt ? formatDate(selectedUser.createdAt) : 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Clock size={14} /> Last Activity
                    </div>
                    <span className="text-xs text-green-600">{selectedUser?.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}</span>
                  </div>

                  {/* THÔNG TIN PASSWORD HARDCODE */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Key size={14} /> Password Updated
                    </div>
                    <span className="text-xs font-bold text-slate-900">30 days ago</span>
                  </div>
                </div>
              ) : (
                /* CHẾ ĐỘ CHỈNH SỬA (EDIT MODE) */
                <div className="space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  {selectedUser?.status !== 'SUSPENDED' && (
                    <SelectOption
                      label="User Role"
                      icon={Shield}
                      value={formData.roleId}
                      onChange={(val) => setFormData({ ...formData, roleId: val })}
                      options={rolesList.filter(role => role.name !== 'ADMIN').map(role => ({ value: role.id, label: role.name }))}
                      placeholder="Select a role..."
                    />
                  )}

                  {selectedUser?.status !== 'SUSPENDED' && (
                    <SelectOption
                      label="Franchise Assignment"
                      icon={Store}
                      value={formData.franchiseId}
                      onChange={(val) => setFormData({ ...formData, franchiseId: val })}
                      options={franchisesList.filter(fr => fr.status === 'ACTIVE').map(fr => ({ value: fr.id, label: fr.name }))}
                      placeholder="No Franchise assigned or franchise of user is inactive"
                    />
                  )}

                  <SelectOption
                    label="Account Status"
                    icon={CheckCircle2}
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={getStatusOptions(selectedUser.status)}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedUser?.status !== 'INACTIVE' && (
              <div className="pt-4 flex gap-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTriggerSave}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#d9a13b] text-white rounded-xl text-sm font-bold hover:bg-[#c49033] transition-all"
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmUpdate}
        onClose={() => setShowConfirmUpdate(false)}
        onConfirm={handleConfirmSave}
        title="Confirm Update"
        message={`Are you sure you want to save changes for ${selectedUser?.fullName}?`}
        confirmText="Save Changes"
        type="warning"
      />
    </div>
  );
};

export default UserDetailModal;