'use client';
import { ChangeEvent, useEffect, useState } from 'react';
import { api, User } from '@/lib/client';

export default function MePage() {
  const [me, setMe] = useState<User | null>(null);
  const [bio, setBio] = useState('');
  const [avatarURL, setAvatarURL] = useState('');
  const [message, setMessage] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function load() {
    const user = await api<User>('/auth/me');
    setMe(user);
    setBio(user.bio || '');
    setAvatarURL(user.avatar_url || '');
  }

  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);

  async function onAvatarSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const previousAvatarURL = avatarURL;
    const previewURL = URL.createObjectURL(file);
    setAvatarURL(previewURL);
    setUploadingAvatar(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const user = await api<User>('/me/avatar', {
        method: 'POST',
        body: formData,
      });
      setMe(user);
      setAvatarURL(user.avatar_url || previewURL);
      setMessage('头像已上传');
    } catch (error) {
      setAvatarURL(previousAvatarURL);
      setMessage(error instanceof Error ? error.message : '头像上传失败');
    } finally {
      setUploadingAvatar(false);
      URL.revokeObjectURL(previewURL);
      event.target.value = '';
    }
  }

  async function saveProfile() {
    try {
      const user = await api<User>('/me', {
        method: 'PATCH',
        body: JSON.stringify({ avatar_url: avatarURL, bio }),
      });
      setMe(user);
      setMessage('个人资料已保存');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    }
  }

  return (
    <div className="card space-y-5">
      <h1 className="text-2xl font-bold">用户中心</h1>
      {me ? (
        <>
          <div className="grid gap-5 md:grid-cols-[260px_1fr]">
            <div className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-fuchsia-50 to-cyan-50 p-5 shadow-xl shadow-fuchsia-100/70">
              <div className="rounded-[1.6rem] border border-white/80 bg-white/80 p-4 text-center shadow-sm backdrop-blur">
                <div className="mx-auto h-36 w-36 overflow-hidden rounded-[1.9rem] border border-fuchsia-100 bg-white shadow-md shadow-fuchsia-100/70">
                  {avatarURL ? (
                    <img src={avatarURL} alt={`${me.username} 的头像`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-100 to-cyan-100 text-4xl font-black text-fuchsia-600">
                      {me.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="mt-4 text-lg font-black text-slate-900">{me.username}</p>
                <p className="mt-1 text-sm text-slate-500">{me.role}</p>
                <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-200/60">
                  {uploadingAvatar ? '上传中...' : '更换头像'}
                  <input type="file" accept="image/*" className="hidden" onChange={onAvatarSelected} disabled={uploadingAvatar} />
                </label>
                <p className="mt-3 text-xs text-slate-500">正式上传到 Supabase Storage，自动生成公开头像链接。</p>
              </div>
            </div>
            <div className="space-y-4 rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl shadow-cyan-100/60 backdrop-blur">
              <div>
                <p className="text-sm text-slate-500">用户名</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{me.username}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">角色</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{me.role}</p>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">个性签名</span>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={255} />
              </label>
              <div className="flex gap-4 text-sm font-semibold">
                <a href="/me/posts">我的帖子</a>
                <a href="/me/favorites">我的收藏</a>
                <a href="/me/notifications">消息通知</a>
              </div>
              <button type="button" onClick={saveProfile}>保存资料</button>
            </div>
          </div>
          {message ? <p className="text-sm text-fuchsia-600">{message}</p> : null}
        </>
      ) : (
        <p>{message || '加载中...'}</p>
      )}
    </div>
  );
}
