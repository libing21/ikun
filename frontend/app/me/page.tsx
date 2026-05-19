'use client';
import { ChangeEvent, useEffect, useState } from 'react';
import { api, User } from '@/lib/client';

export default function MePage() {
  const [me, setMe] = useState<User | null>(null);
  const [bio, setBio] = useState('');
  const [avatarURL, setAvatarURL] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const user = await api<User>('/auth/me');
    setMe(user);
    setBio(user.bio || '');
    setAvatarURL(user.avatar_url || '');
  }

  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);

  function onAvatarSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarURL(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <div className="flex flex-col items-center gap-3">
              <div className="h-28 w-28 overflow-hidden rounded-[1.75rem] border border-fuchsia-100 bg-white shadow-sm">
                {avatarURL ? (
                  <img src={avatarURL} alt={`${me.username} 的头像`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-100 to-cyan-100 text-3xl font-black text-fuchsia-600">
                    {me.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <label className="text-sm font-semibold text-fuchsia-600">
                上传头像
                <input type="file" accept="image/*" className="hidden" onChange={onAvatarSelected} />
              </label>
            </div>
            <div className="flex-1 space-y-3">
              <p>用户名：{me.username}</p>
              <p>角色：{me.role}</p>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">个性签名</span>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={255} />
              </label>
              <div className="flex gap-4 text-sm font-semibold">
                <a href="/me/posts">我的帖子</a>
                <a href="/me/favorites">我的收藏</a>
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
